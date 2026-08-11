import { Injectable } from '@nestjs/common';
import { eq, and, ne, inArray, sql, aliasedTable } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { categoryHierarchyTable } from '@/_db/drizzle/schema/taxonomy';
import type { DrizzleTx } from '@/libs/db/types';

@Injectable()
export class CategoryHierarchyRepository {
  constructor(private readonly db: DrizzleService) {}

  /**
   * Insert a new node into the hierarchy.
   * This involves inserting a self-referencing relationship (depth 0)
   * and linking all of the parent's ancestors to this new node.
   */
  async insertNode(
    tx: DrizzleTx,
    ancestorId: string | null,
    descendantId: string,
  ): Promise<void> {
    // 1. Insert self-reference
    await tx.insert(categoryHierarchyTable).values({
      ancestorId: descendantId,
      descendantId: descendantId,
      depth: 0,
    });

    if (ancestorId) {
      // 2. Insert relationships with all ancestors of the parent
      await tx.insert(categoryHierarchyTable).select(
        tx
          .select({
            ancestorId: categoryHierarchyTable.ancestorId,
            descendantId: sql<string>`${descendantId}`.as('descendantId'),
            depth: sql<number>`${categoryHierarchyTable.depth} + 1`.as('depth'),
          })
          .from(categoryHierarchyTable)
          .where(eq(categoryHierarchyTable.descendantId, ancestorId)),
      );
    }
  }

  /**
   * Move a node and its entire subtree to a new parent.
   */
  async moveSubtree(
    tx: DrizzleTx,
    nodeId: string,
    newParentId: string | null,
  ): Promise<void> {
    // 1. Delete all paths that connect the node's subtree to the node's old ancestors (excluding self)
    await tx.delete(categoryHierarchyTable).where(
      and(
        inArray(
          categoryHierarchyTable.descendantId,
          tx
            .select({ id: categoryHierarchyTable.descendantId })
            .from(categoryHierarchyTable)
            .where(eq(categoryHierarchyTable.ancestorId, nodeId)),
        ),
        inArray(
          categoryHierarchyTable.ancestorId,
          tx
            .select({ id: categoryHierarchyTable.ancestorId })
            .from(categoryHierarchyTable)
            .where(
              and(
                eq(categoryHierarchyTable.descendantId, nodeId),
                ne(categoryHierarchyTable.ancestorId, nodeId),
              ),
            ),
        ),
      ),
    );

    // 2. Re-insert paths connecting the node's subtree to its new ancestors
    if (newParentId) {
      const supertree = aliasedTable(categoryHierarchyTable, 'supertree');
      const subtree = aliasedTable(categoryHierarchyTable, 'subtree');

      await tx.insert(categoryHierarchyTable).select(
        tx
          .select({
            ancestorId: supertree.ancestorId,
            descendantId: subtree.descendantId,
            depth: sql<number>`${supertree.depth} + ${subtree.depth} + 1`.as(
              'depth',
            ),
          })
          .from(supertree)
          .innerJoin(subtree, eq(subtree.ancestorId, nodeId))
          .where(eq(supertree.descendantId, newParentId)),
      );
    }
  }

  /**
   * Delete a node and all of its descendants from the hierarchy.
   * The actual `categories` table soft delete handles this via cascading foreign keys,
   * but if we want manual control, we can wipe the closure edges.
   */
  async deleteSubtree(tx: DrizzleTx, nodeId: string): Promise<void> {
    await tx
      .delete(categoryHierarchyTable)
      .where(
        inArray(
          categoryHierarchyTable.descendantId,
          tx
            .select({ id: categoryHierarchyTable.descendantId })
            .from(categoryHierarchyTable)
            .where(eq(categoryHierarchyTable.ancestorId, nodeId)),
        ),
      );
  }

  /**
   * Find immediate children of a given node
   */
  async findChildren(nodeId: string) {
    return this.db.client
      .select({ childId: categoryHierarchyTable.descendantId })
      .from(categoryHierarchyTable)
      .where(
        and(
          eq(categoryHierarchyTable.ancestorId, nodeId),
          eq(categoryHierarchyTable.depth, 1),
        ),
      );
  }
}
