import { Controller, Get, Redirect } from '@nestjs/common';
import { Public } from '@/modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  @Redirect('https://linlifeng.top', 302)
  root() {}
}
