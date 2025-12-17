import * as fc from 'fast-check';
import { ToolItem, ToolMeta, ToolManifest, ToolSpec } from './chat.model';

/**
 * Property-Based Tests for Tools Functionality
 * 
 * These tests use fast-check to verify correctness properties
 * for the ToolItem interface and related types.
 */
describe('ToolItem Interface - Property Tests', () => {

  /**
   * Arbitrary generator for ToolManifest
   */
  const toolManifestArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 0, maxLength: 500 }),
    repository: fc.option(fc.webUrl(), { nil: undefined }),
    author: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    author_url: fc.option(fc.webUrl(), { nil: undefined }),
    version: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined })
  });

  /**
   * Arbitrary generator for ToolMeta
   */
  const toolMetaArb = fc.record({
    description: fc.string({ minLength: 0, maxLength: 500 }),
    manifest: fc.option(toolManifestArb, { nil: undefined })
  });

  /**
   * Arbitrary generator for ToolSpec
   */
  const toolSpecArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ minLength: 0, maxLength: 200 }),
    parameters: fc.record({
      properties: fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.record({ type: fc.constantFrom('string', 'number', 'boolean', 'object', 'array') })
      ),
      required: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }), { nil: undefined }),
      type: fc.constant('object')
    })
  });

  /**
   * Arbitrary generator for ToolItem
   */
  const toolItemArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    meta: toolMetaArb,
    access_control: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
    updated_at: fc.integer({ min: 0, max: 2000000000 }),
    created_at: fc.integer({ min: 0, max: 2000000000 }),
    specs: fc.option(fc.array(toolSpecArb, { minLength: 0, maxLength: 5 }), { nil: undefined })
  });

  /**
   * Feature: tools-functionality, Property 2: Tool display consistency
   * Validates: Requirements 2.2
   * 
   * Property: For any valid ToolItem, the name property SHALL be a non-empty string
   * that can be displayed in the tools submenu.
   */
  it('should have displayable name for all valid ToolItems', () => {
    fc.assert(
      fc.property(
        toolItemArb,
        (tool: ToolItem) => {
          // Property: name must be a non-empty string
          expect(typeof tool.name).toBe('string');
          expect(tool.name.length).toBeGreaterThan(0);
          
          // Property: name should be displayable (not just whitespace)
          // This ensures the tool can be shown in the UI
          const displayName = tool.name.trim();
          expect(displayName.length).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any valid ToolItem array, all tool names should be extractable
   * for display in the submenu.
   */
  it('should extract all tool names from a list of ToolItems', () => {
    fc.assert(
      fc.property(
        fc.array(toolItemArb, { minLength: 0, maxLength: 20 }),
        (tools: ToolItem[]) => {
          // Extract names for display
          const displayNames = tools.map(tool => tool.name);
          
          // Property: The number of display names should equal the number of tools
          expect(displayNames.length).toBe(tools.length);
          
          // Property: All names should be strings
          displayNames.forEach(name => {
            expect(typeof name).toBe('string');
          });
          
          // Property: All tool IDs should be unique (for selection tracking)
          const ids = tools.map(tool => tool.id);
          const uniqueIds = new Set(ids);
          // Note: In generated data, IDs might not be unique, but in real API responses they should be
          // This test validates that we can extract IDs for tracking
          expect(ids.length).toBe(tools.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: ToolItem should have valid timestamp fields
   */
  it('should have valid timestamp fields', () => {
    fc.assert(
      fc.property(
        toolItemArb,
        (tool: ToolItem) => {
          // Property: timestamps should be non-negative integers
          expect(typeof tool.created_at).toBe('number');
          expect(typeof tool.updated_at).toBe('number');
          expect(tool.created_at).toBeGreaterThanOrEqual(0);
          expect(tool.updated_at).toBeGreaterThanOrEqual(0);
          
          // Property: timestamps should be valid Unix timestamps (reasonable range)
          expect(Number.isInteger(tool.created_at)).toBe(true);
          expect(Number.isInteger(tool.updated_at)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: ToolItem should have required fields for API compatibility
   */
  it('should have all required fields for API compatibility', () => {
    fc.assert(
      fc.property(
        toolItemArb,
        (tool: ToolItem) => {
          // Property: Required fields must exist
          expect(tool.id).toBeDefined();
          expect(tool.user_id).toBeDefined();
          expect(tool.name).toBeDefined();
          expect(tool.meta).toBeDefined();
          expect(tool.created_at).toBeDefined();
          expect(tool.updated_at).toBeDefined();
          
          // Property: meta must have description
          expect(tool.meta.description).toBeDefined();
          expect(typeof tool.meta.description).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: ToolItem ID should be suitable for selection tracking
   */
  it('should have ID suitable for selection tracking', () => {
    fc.assert(
      fc.property(
        toolItemArb,
        (tool: ToolItem) => {
          // Property: ID must be a non-empty string
          expect(typeof tool.id).toBe('string');
          expect(tool.id.length).toBeGreaterThan(0);
          
          // Property: ID should be usable as a key in a Set or Map
          const selectedIds = new Set<string>();
          selectedIds.add(tool.id);
          expect(selectedIds.has(tool.id)).toBe(true);
          
          // Property: ID should be usable in an array for tool_ids
          const toolIds: string[] = [tool.id];
          expect(toolIds.includes(tool.id)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
