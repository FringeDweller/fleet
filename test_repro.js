#!/usr/bin/env bun
// Mock Drizzle and Schema
const mockTable = {
    organizationId: { name: 'organization_id' },
    assetNumber: { name: 'asset_number' },
    vin: { name: 'vin' }
};

const mockDb = {
    select: (selection) => {
        console.log('db.select called with:', selection ? Object.keys(selection) : 'ALL');
        return {
            from: (table) => {
                console.log('from called');
                return {
                    where: (condition) => {
                        console.log('where called');
                        return {
                            limit: (n) => {
                                console.log('limit called');
                                return Promise.resolve([{ id: 1 }]);
                            }
                        }
                    }
                }
            }
        }
    }
};

const TABLE_MAP = {
    assets: mockTable
};

// Mock eq
const eq = (col, val) => ({ col, val });

// Service Logic copy-pasted (simplified for test)
async function executeReport(definition, organizationId) {
    console.log('executeReport called', { definition, organizationId })
    const table = TABLE_MAP[definition.dataSource];
    if (!table) {
        console.error('Invalid data source', definition.dataSource)
        throw new Error('Invalid data source')
    }

    let selection;

    if (definition.columns && Array.isArray(definition.columns) && definition.columns.length > 0) {
      selection = {}
      for (const col of definition.columns) {
        if (table[col]) {
          selection[col] = table[col]
        }
      }
    }
    
    console.log('Building query with selection', Object.keys(selection || {}))
    const query = selection && Object.keys(selection).length > 0
      ? mockDb.select(selection).from(table)
      : mockDb.select().from(table)

    console.log('Executing query...')
    const result = await query.where(eq(table.organizationId, organizationId)).limit(100)
    console.log('Query executed, rows:', result.length)
    return result
}

// Run test
(async () => {
    try {
        console.log('--- Test 1: No columns (Select All) ---');
        await executeReport({ dataSource: 'assets', columns: [] }, 'org-1');

        console.log('\n--- Test 2: Specific columns ---');
        await executeReport({ dataSource: 'assets', columns: ['assetNumber'] }, 'org-1');
        
        console.log('\n--- Test 3: Invalid column ---');
        await executeReport({ dataSource: 'assets', columns: ['invalidCol'] }, 'org-1');
        
    } catch (e) {
        console.error('Test failed:', e);
    }
})();