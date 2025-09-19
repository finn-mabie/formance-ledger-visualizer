import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Wand2 } from 'lucide-react'

interface QueryCondition {
  id: string
  operation: 'match' | 'exists' | 'lt' | 'lte' | 'gt' | 'gte' | 'not'
  field: string
  value: string
  fieldType: 'address' | 'metadata' | 'balance' | 'reference' | 'timestamp' | 'reverted' | 'account' | 'source' | 'destination'
}

interface QueryBuilderProps {
  resource: 'transactions' | 'accounts' | 'volumes' | 'balances'
  onQueryChange: (query: string) => void
}

export function QueryBuilder({ resource, onQueryChange }: QueryBuilderProps) {
  const [operator, setOperator] = useState<'and' | 'or'>('and')
  const [conditions, setConditions] = useState<QueryCondition[]>([
    {
      id: '1',
      operation: 'match',
      field: '',
      value: '',
      fieldType: 'address'
    }
  ])

  // Field options based on resource type
  const getFieldOptions = () => {
    switch (resource) {
      case 'accounts':
        return [
          { value: 'address', label: 'Address' },
          { value: 'metadata', label: 'Metadata' },
          { value: 'balance', label: 'Balance' }
        ]
      case 'transactions':
        return [
          { value: 'reference', label: 'Reference' },
          { value: 'timestamp', label: 'Timestamp' },
          { value: 'reverted', label: 'Reverted' },
          { value: 'account', label: 'Account (Source or Destination)' },
          { value: 'source', label: 'Source Account' },
          { value: 'destination', label: 'Destination Account' },
          { value: 'metadata', label: 'Metadata' }
        ]
      case 'volumes':
        return [
          { value: 'address', label: 'Account' },
          { value: 'metadata', label: 'Metadata' },
          { value: 'balance', label: 'Balance' }
        ]
      case 'balances':
        return [
          { value: 'address', label: 'Account' },
          { value: 'metadata', label: 'Metadata' },
          { value: 'balance', label: 'Balance' }
        ]
      default:
        return []
    }
  }

  // Operation options
  const getOperationOptions = () => [
    { value: 'match', label: 'Match (equals)' },
    { value: 'exists', label: 'Exists' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less than or equal' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater than or equal' },
    { value: 'not', label: 'Not' }
  ]

  // Generate field name based on field type and value
  const getFieldName = (condition: QueryCondition) => {
    if (condition.fieldType === 'metadata') {
      return `metadata[${condition.field}]`
    } else if (condition.fieldType === 'balance') {
      return `balance[${condition.field}]`
    } else if (condition.fieldType === 'address') {
      return 'address'
    } else if (condition.fieldType === 'account') {
      return 'account'
    } else {
      return condition.fieldType
    }
  }

  // Generate JSON query from conditions
  const generateQuery = () => {
    if (conditions.length === 0) return '{}'
    
    if (conditions.length === 1) {
      const condition = conditions[0]
      const fieldName = getFieldName(condition)
      
      if (condition.operation === 'exists') {
        return JSON.stringify({ $exists: fieldName })
      } else if (condition.operation === 'not') {
        return JSON.stringify({ $not: { $match: { [fieldName]: condition.value } } })
      } else {
        return JSON.stringify({ [`$${condition.operation}`]: { [fieldName]: condition.value } })
      }
    } else {
      const conditionObjects = conditions.map(condition => {
        const fieldName = getFieldName(condition)
        
        if (condition.operation === 'exists') {
          return { $exists: fieldName }
        } else if (condition.operation === 'not') {
          return { $not: { $match: { [fieldName]: condition.value } } }
        } else {
          return { [`$${condition.operation}`]: { [fieldName]: condition.value } }
        }
      })
      
      return JSON.stringify({ [`$${operator}`]: conditionObjects })
    }
  }

  // Generate English description of the query
  const generateDescription = () => {
    if (conditions.length === 0) return 'No filters applied'
    
    const resourceNames = {
      'transactions': 'transactions',
      'accounts': 'accounts', 
      'volumes': 'volumes',
      'balances': 'aggregate balances'
    }
    
    const resourceName = resourceNames[resource] || 'items'
    
    const describeCondition = (condition: QueryCondition) => {
      const fieldName = getFieldName(condition)
      
      if (condition.operation === 'exists') {
        if (condition.fieldType === 'metadata') {
          return `metadata field "${condition.field}" exists`
        } else if (condition.fieldType === 'balance') {
          return `balance for asset "${condition.field}" exists`
        } else if (condition.fieldType === 'source') {
          return `source account exists`
        } else if (condition.fieldType === 'destination') {
          return `destination account exists`
        } else if (condition.fieldType === 'address') {
          return `account exists`
        } else if (condition.fieldType === 'account') {
          return `account (source or destination) exists`
        } else {
          return `field "${fieldName}" exists`
        }
      } else if (condition.operation === 'not') {
        if (condition.fieldType === 'metadata') {
          return `metadata field "${condition.field}" not matching "${condition.value}"`
        } else if (condition.fieldType === 'balance') {
          return `balance for asset "${condition.field}" not matching "${condition.value}"`
        } else if (condition.fieldType === 'source') {
          return `source account is not "${condition.value}"`
        } else if (condition.fieldType === 'destination') {
          return `destination account is not "${condition.value}"`
        } else if (condition.fieldType === 'address') {
          return `account is not "${condition.value}"`
        } else if (condition.fieldType === 'account') {
          return `account (source or destination) is not "${condition.value}"`
        } else {
          return `field "${fieldName}" not matching "${condition.value}"`
        }
      } else {
        const operationText = {
          'match': 'is',
          'lt': 'is less than',
          'lte': 'is less than or equal to',
          'gt': 'is greater than',
          'gte': 'is greater than or equal to'
        }[condition.operation] || 'is'
        
        if (condition.fieldType === 'metadata') {
          return `metadata field "${condition.field}" ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'balance') {
          return `balance for asset "${condition.field}" ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'source') {
          return `source account ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'destination') {
          return `destination account ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'address') {
          return `account ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'account') {
          return `account (source or destination) ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'reference') {
          return `reference ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'timestamp') {
          return `timestamp ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'reverted') {
          return `reverted status ${operationText} "${condition.value}"`
        } else if (condition.fieldType === 'address') {
          return `address ${operationText} "${condition.value}"`
        } else {
          return `field "${fieldName}" ${operationText} "${condition.value}"`
        }
      }
    }
    
    if (conditions.length === 1) {
      return `${resourceName} where ${describeCondition(conditions[0])}`
    } else {
      const conditionDescriptions = conditions.map(describeCondition)
      const operatorText = operator === 'and' ? 'AND' : 'OR'
      return `${resourceName} where (${conditionDescriptions.join(` ${operatorText} `)})`
    }
  }

  // Update query when conditions change
  useEffect(() => {
    onQueryChange(generateQuery())
  }, [conditions, operator])

  // Reset conditions when resource changes
  useEffect(() => {
    setConditions([{
      id: '1',
      operation: 'match',
      field: '',
      value: '',
      fieldType: 'address'
    }])
  }, [resource])

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: Date.now().toString(),
      operation: 'match',
      field: '',
      value: '',
      fieldType: 'address'
    }
    setConditions([...conditions, newCondition])
  }

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id))
    }
  }

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ))
  }

  const beautifyQuery = () => {
    try {
      const parsed = JSON.parse(generateQuery())
      onQueryChange(JSON.stringify(parsed, null, 2))
    } catch (e) {
      // If beautify fails, just use the generated query
      onQueryChange(generateQuery())
    }
  }

  return (
    <div className="space-y-4">
      {/* Operator Selection */}
      <div className="flex items-center gap-2">
        <label className="label">Combine conditions with:</label>
        <select 
          className="input h-10 w-32" 
          value={operator} 
          onChange={(e) => setOperator(e.target.value as 'and' | 'or')}
          disabled={conditions.length < 2}
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
        </select>
      </div>

      {/* Conditions */}
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={condition.id} className="p-3 border border-slate-700 rounded bg-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-slate-400">Condition {index + 1}</span>
              {conditions.length > 1 && (
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Field Type */}
              <div>
                <label className="label text-xs">Field Type</label>
                <select
                  className="input h-8 text-xs"
                  value={condition.fieldType}
                  onChange={(e) => updateCondition(condition.id, { 
                    fieldType: e.target.value as any,
                    field: '',
                    value: ''
                  })}
                >
                  {getFieldOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Name (for metadata/balance) */}
              {(condition.fieldType === 'metadata' || condition.fieldType === 'balance') && (
                <div>
                  <label className="label text-xs">
                    {condition.fieldType === 'metadata' ? 'Meta Key' : 'Asset'}
                  </label>
                  <input
                    type="text"
                    className="input h-8 text-xs"
                    placeholder={condition.fieldType === 'metadata' ? 'e.g., test' : 'e.g., USD'}
                    value={condition.field}
                    onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                  />
                </div>
              )}

              {/* Operation */}
              <div>
                <label className="label text-xs">Operation</label>
                <select
                  className="input h-8 text-xs"
                  value={condition.operation}
                  onChange={(e) => updateCondition(condition.id, { operation: e.target.value as any })}
                >
                  {getOperationOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value (not needed for exists) */}
              {condition.operation !== 'exists' && (
                <div>
                  <label className="label text-xs">Value</label>
                  <input
                    type="text"
                    className="input h-8 text-xs"
                    placeholder={
                      condition.fieldType === 'timestamp' ? '2024-01-01T00:00:00Z' :
                      condition.fieldType === 'reverted' ? 'true or false' :
                      condition.fieldType === 'balance' ? '100' :
                      'Enter value'
                    }
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Condition Button */}
      <button
        onClick={addCondition}
        className="btn-secondary inline-flex items-center gap-2 px-3 h-9"
      >
        <Plus className="h-4 w-4" />
        <span>Add Condition</span>
      </button>

      {/* English Description */}
      <div>
        <label className="label">Query Description</label>
        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-200">
          {generateDescription()}
        </div>
      </div>

      {/* Generated Query Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label">Generated Query (JSON)</label>
          <button
            onClick={beautifyQuery}
            className="btn-secondary inline-flex items-center gap-2 px-3 h-8 text-xs"
          >
            <Wand2 className="h-3 w-3" />
            <span>Beautify</span>
          </button>
        </div>
        <textarea
          className="input min-h-[100px] font-mono text-xs"
          value={generateQuery()}
          readOnly
        />
      </div>
    </div>
  )
}
