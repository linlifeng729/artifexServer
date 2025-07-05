import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class UserController {
  @Get('user')
  getUser() {
    return { message: 'Hello, this is the user endpoint!' };
  }
} 