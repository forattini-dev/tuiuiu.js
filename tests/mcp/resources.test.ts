import { describe, it, expect } from 'vitest';
import {
  getStaticResources,
  getResourceTemplates,
  readResource,
} from '../../src/mcp/resources.js';

describe('MCP Resources', () => {
  describe('getStaticResources', () => {
    it('should return array of resources', () => {
      const resources = getStaticResources();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
    });

    it('should include component resources', () => {
      const resources = getStaticResources();
      const componentResources = resources.filter(r =>
        r.uri.startsWith('tuiuiu://component/')
      );

      expect(componentResources.length).toBeGreaterThan(0);

      // Check for known components
      const boxResource = componentResources.find(r =>
        r.uri === 'tuiuiu://component/Box'
      );
      expect(boxResource).toBeDefined();
      expect(boxResource!.name).toBe('Box');
      expect(boxResource!.mimeType).toBe('text/markdown');
    });

    it('should include hook resources', () => {
      const resources = getStaticResources();
      const hookResources = resources.filter(r =>
        r.uri.startsWith('tuiuiu://hook/')
      );

      expect(hookResources.length).toBeGreaterThan(0);
    });

    it('should include theme resources', () => {
      const resources = getStaticResources();
      const themeResources = resources.filter(r =>
        r.uri.startsWith('tuiuiu://theme/')
      );

      expect(themeResources.length).toBeGreaterThan(0);
    });

    it('should include guide resources', () => {
      const resources = getStaticResources();
      const guideResources = resources.filter(r =>
        r.uri.startsWith('tuiuiu://guide/')
      );

      expect(guideResources.length).toBeGreaterThan(0);

      const gettingStarted = guideResources.find(r =>
        r.uri === 'tuiuiu://guide/getting-started'
      );
      expect(gettingStarted).toBeDefined();
    });

    it('should include category resources', () => {
      const resources = getStaticResources();
      const categoryResources = resources.filter(r =>
        r.uri.startsWith('tuiuiu://category/')
      );

      expect(categoryResources.length).toBeGreaterThan(0);
    });

    it('should include example resources', () => {
      const resources = getStaticResources();
      const exampleResources = resources.filter(r =>
        r.uri.startsWith('tuiuiu://example/')
      );

      expect(exampleResources.length).toBeGreaterThan(0);

      const counterExample = exampleResources.find(r =>
        r.uri === 'tuiuiu://example/counter'
      );
      expect(counterExample).toBeDefined();
    });
  });

  describe('getResourceTemplates', () => {
    it('should return array of templates', () => {
      const templates = getResourceTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include component template', () => {
      const templates = getResourceTemplates();
      const componentTemplate = templates.find(t =>
        t.uriTemplate === 'tuiuiu://component/{name}'
      );

      expect(componentTemplate).toBeDefined();
      expect(componentTemplate!.name).toBe('Component Documentation');
    });

    it('should include all expected templates', () => {
      const templates = getResourceTemplates();
      const templateUris = templates.map(t => t.uriTemplate);

      expect(templateUris).toContain('tuiuiu://component/{name}');
      expect(templateUris).toContain('tuiuiu://hook/{name}');
      expect(templateUris).toContain('tuiuiu://theme/{name}');
      expect(templateUris).toContain('tuiuiu://category/{category}');
      expect(templateUris).toContain('tuiuiu://example/{id}');
      expect(templateUris).toContain('tuiuiu://guide/{topic}');
      expect(templateUris).toContain('tuiuiu://props/{component}');
      expect(templateUris).toContain('tuiuiu://related/{component}');
    });
  });

  describe('readResource', () => {
    it('should return null for invalid URI', () => {
      const result = readResource('invalid://uri');
      expect(result).toBeNull();
    });

    it('should return null for unknown resource', () => {
      const result = readResource('tuiuiu://component/UnknownComponent');
      expect(result).toBeNull();
    });

    it('should read component resource', () => {
      const result = readResource('tuiuiu://component/Box');

      expect(result).not.toBeNull();
      expect(result!.uri).toBe('tuiuiu://component/Box');
      expect(result!.mimeType).toBe('text/markdown');
      expect(result!.text).toContain('# Box');
      expect(result!.text).toContain('Props');
    });

    it('should read hook resource', () => {
      const result = readResource('tuiuiu://hook/useState');

      expect(result).not.toBeNull();
      expect(result!.uri).toBe('tuiuiu://hook/useState');
      expect(result!.text).toContain('# useState');
    });

    it('should read category resource', () => {
      const result = readResource('tuiuiu://category/atoms');

      expect(result).not.toBeNull();
      expect(result!.uri).toBe('tuiuiu://category/atoms');
      expect(result!.text).toContain('# Atoms');
    });

    it('should read guide resource', () => {
      const result = readResource('tuiuiu://guide/getting-started');

      expect(result).not.toBeNull();
      expect(result!.text).toContain('Getting Started');
      expect(result!.text).toContain('Installation');
    });

    it('should read example resource', () => {
      const result = readResource('tuiuiu://example/counter');

      expect(result).not.toBeNull();
      expect(result!.text).toContain('Counter');
      expect(result!.text).toContain('useState');
    });

    it('should read props resource', () => {
      const result = readResource('tuiuiu://props/Box');

      expect(result).not.toBeNull();
      expect(result!.text).toContain('# Box Props');
      expect(result!.text).toContain('Name');
      expect(result!.text).toContain('Type');
    });

    it('should read related resource', () => {
      const result = readResource('tuiuiu://related/Box');

      expect(result).not.toBeNull();
      expect(result!.text).toContain('Related to Box');
    });

    it('should be case-insensitive for component names', () => {
      const result1 = readResource('tuiuiu://component/box');
      const result2 = readResource('tuiuiu://component/BOX');
      const result3 = readResource('tuiuiu://component/Box');

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result3).not.toBeNull();
    });
  });
});
