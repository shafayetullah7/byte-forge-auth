import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OidcAccessToken } from '@/libs/decorators/oidc-access-token.decorator';
import { JwtResourceGuard } from '@/libs/auth/jwt-resource.guard';
import { OidcAccessTokenContext } from '@/libs/types/oidc-access-token.type';
import { ResponseService } from '@/libs/modules/response/response.service';
import { OidcIdentityProvisionerService } from '@/modules/auth/application/oidc-identity-provisioner.service';

@ApiTags('Example (OIDC resource server)')
@Controller({ path: 'example', version: '1' })
export class OidcExampleController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly oidcProvisioner: OidcIdentityProvisionerService,
  ) {}

  @ApiOperation({ summary: 'OIDC-protected example with local user mapping' })
  @ApiBearerAuth()
  @UseGuards(JwtResourceGuard)
  @Get('oidc-protected')
  async getOidcProtected(@OidcAccessToken() token: OidcAccessTokenContext) {
    const user = await this.oidcProvisioner.provisionFromToken(token);

    return this.responseService.success({
      message: 'OIDC access token accepted',
      data: {
        sub: token.sub,
        localUserId: user.id,
        email: user.email,
      },
    });
  }
}
