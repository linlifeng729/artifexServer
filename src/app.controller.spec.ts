import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('根路径重定向功能', () => {
    it('应该存在重定向方法', () => {
      expect(appController.root).toBeDefined();
      expect(typeof appController.root).toBe('function');
    });

    it('调用重定向方法不应该抛出错误', () => {
      expect(() => appController.root()).not.toThrow();
    });
  });
});
