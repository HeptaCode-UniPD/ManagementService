import { Test, TestingModule } from '@nestjs/testing';
import { PersistenceAdapter } from './adapter.persistence';
import { RequestDTO } from '../domain/dto/request.dto';

describe('PersistenceAdapter', () => {
  let adapter: PersistenceAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersistenceAdapter],
    }).compile();

    adapter = module.get<PersistenceAdapter>(PersistenceAdapter);
  });

  // ─── internalToExternal ──────────────────────────────────────────

  describe('internalToExternal', () => {
    it('should map repoUrl to repository_url', () => {
      const result = adapter.internalToExternal('https://github.com/owner/repo');

      expect(result.repository_url).toBe('https://github.com/owner/repo');
    });

    it('should include a processedAt date', () => {
      const before = new Date();
      const result = adapter.internalToExternal('https://github.com/owner/repo');
      const after = new Date();

      expect(result.processedAt).toBeInstanceOf(Date);
      expect(result.processedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.processedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ─── externalToInternal ──────────────────────────────────────────

  describe('externalToInternal', () => {
    it('should map repository_url to repoUrl', () => {
      const result = adapter.externalToInternal({ repository_url: 'https://github.com/owner/repo' });

      expect(result).toBeInstanceOf(RequestDTO);
      expect(result.repoUrl).toBe('https://github.com/owner/repo');
    });

    it('should return undefined repoUrl if repository_url is missing', () => {
      const result = adapter.externalToInternal({});

      expect(result.repoUrl).toBeUndefined();
    });
  });
});