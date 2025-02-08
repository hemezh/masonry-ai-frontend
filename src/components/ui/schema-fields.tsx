'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Debug logging utility
const log = (message: string, data?: any, path: string[] = []) => {
    const timestamp = new Date().toISOString();
    const pathStr = path.length ? ` [Path: ${path.join('.')}]` : '';
    // console.log(`[SchemaFields ${timestamp}]${pathStr} ${message}`, data || '');
};

interface SchemaFieldsProps {
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    schema: {
        properties?: Record<string, {
            type: string;
            title?: string;
            description?: string;
            enum?: string[] | number[];
            format?: string;
            minimum?: number;
            maximum?: number;
            multiline?: boolean;
            properties?: Record<string, any>; // For nested objects
            items?: {
                type: string;
                properties?: Record<string, any>;
                enum?: string[] | number[];
            }; // For arrays
        }>;
        required?: string[];
    };
    className?: string;
    path?: string[]; // Track nested path for objects
}

export function SchemaFields({ values, onChange, schema, className, path = [] }: SchemaFieldsProps) {
    log('Rendering SchemaFields component', { values, schema, path }, path);

    if (!schema?.properties) {
        log('No schema properties found, returning null', { schema }, path);
        return null;
    }

    const handleValueChange = (key: string, value: any) => {
        log('handleValueChange called', { key, value, currentPath: path }, path);
        
        if (path.length === 0) {
            log('Updating root level value', { key, value }, path);
            onChange({
                ...values,
                [key]: value
            });
        } else {
            log('Updating nested value', { key, value, path }, path);
            const newValues = { ...values };
            let current = newValues;
            
            log('Walking through path', { path, startingValues: newValues }, path);
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    log('Creating missing object in path', { missingKey: path[i] }, path);
                    current[path[i]] = {};
                }
                current = current[path[i]];
            }
            
            const lastPath = path[path.length - 1];
            if (!current[lastPath]) {
                log('Creating missing object at final path', { lastPath }, path);
                current[lastPath] = {};
            }
            current[lastPath][key] = value;
            
            log('Final values after update', { newValues }, path);
            onChange(newValues);
        }
    };

    const getCurrentValue = (key: string) => {
        if (path.length === 0) {
            log('Getting root level value', { key, value: values[key] }, path);
            return values[key];
        }
        
        log('Getting nested value', { key, path }, path);
        let current = values;
        for (const p of path) {
            current = current[p] || {};
            log('Walking path', { pathSegment: p, currentValue: current }, path);
        }
        
        log('Final value retrieved', { key, value: current[key] }, path);
        return current[key];
    };

    const renderField = (key: string, field: any) => {
        log('Rendering field', { key, fieldType: field.type, field }, path);
        
        const value = getCurrentValue(key);
        log('Current field value', { key, value }, path);
        
        const label = field.title || key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        const isRequired = schema.required?.includes(key) || false;

        const labelElement = (
            <Label htmlFor={key} className="flex items-center gap-1">
                {label}
                {isRequired && <span className="text-red-500">*</span>}
            </Label>
        );

        switch (field.type) {
            case 'object':
                log('Rendering object field', { key, objectValue: value || {} }, path);
                const objectValue = value || {};
                return (
                    <div className="space-y-2 border rounded-lg p-4">
                        {labelElement}
                        <SchemaFields
                            values={objectValue}
                            onChange={(newValue) => {
                                log('Object field changed', { key, newValue }, [...path, key]);
                                handleValueChange(key, newValue);
                            }}
                            schema={{ properties: field.properties, required: schema.required }}
                            path={[...path, key]}
                        />
                        {field.description && (
                            <p className="text-sm text-zinc-500">{field.description}</p>
                        )}
                    </div>
                );

            case 'array':
                log('Rendering array field', { key, field, currentValue: value }, path);
                if (field.items?.type === 'string' && field.items.enum) {
                    return (
                        <div className="space-y-2">
                            {labelElement}
                            <Select
                                value={value ?? ''}
                                onValueChange={(newValue) => {
                                    log('Array enum value changed', { key, newValue }, path);
                                    handleValueChange(key, newValue);
                                }}
                                required={isRequired}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={field.description || `Select ${label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.items.enum.map((option: string | number) => (
                                        <SelectItem key={String(option)} value={String(option)}>
                                            {String(option)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {field.description && (
                                <p className="text-sm text-zinc-500">{field.description}</p>
                            )}
                        </div>
                    );
                }
                log('Unsupported array type', { key, field }, path);
                return null;

            case 'boolean':
                log('Rendering boolean field', { key, value }, path);
                return (
                    <div className="flex items-center justify-between space-y-0">
                        {labelElement}
                        <Switch
                            id={key}
                            checked={value || false}
                            onCheckedChange={(checked) => {
                                log('Boolean value changed', { key, checked }, path);
                                handleValueChange(key, checked);
                            }}
                        />
                    </div>
                );

            case 'number':
            case 'integer':
                log('Rendering number/integer field', { key, value, type: field.type }, path);
                return (
                    <div className="space-y-2">
                        {labelElement}
                        <Input
                            id={key}
                            type="number"
                            value={value ?? ''}
                            onChange={(e) => {
                                const newValue = e.target.value === '' ? '' : Number(e.target.value);
                                log('Number/integer value changed', { key, newValue }, path);
                                handleValueChange(key, newValue);
                            }}
                            min={field.minimum}
                            max={field.maximum}
                            step={field.type === 'integer' ? 1 : 'any'}
                            placeholder={field.description}
                            required={isRequired}
                        />
                        {field.description && (
                            <p className="text-sm text-zinc-500">{field.description}</p>
                        )}
                    </div>
                );

            case 'string':
                if (field.enum) {
                    return (
                        <div className="space-y-2">
                            {labelElement}
                            <Select
                                value={value ?? ''}
                                onValueChange={(value) => handleValueChange(key, value)}
                                required={isRequired}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={field.description || `Select ${label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.enum.map((option: string | number) => (
                                        <SelectItem key={String(option)} value={String(option)}>
                                            {String(option)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {field.description && (
                                <p className="text-sm text-zinc-500">{field.description}</p>
                            )}
                        </div>
                    );
                }

                if (field.multiline || field.format === 'text-long') {
                    return (
                        <div className="space-y-2">
                            {labelElement}
                            <Textarea
                                id={key}
                                value={value ?? ''}
                                onChange={(e) => handleValueChange(key, e.target.value)}
                                placeholder={field.description}
                                rows={4}
                                required={isRequired}
                            />
                            {field.description && (
                                <p className="text-sm text-zinc-500">{field.description}</p>
                            )}
                        </div>
                    );
                }

                return (
                    <div className="space-y-2">
                        {labelElement}
                        <Input
                            id={key}
                            type="text"
                            value={value ?? ''}
                            onChange={(e) => handleValueChange(key, e.target.value)}
                            placeholder={field.description}
                            required={isRequired}
                        />
                        {field.description && (
                            <p className="text-sm text-zinc-500">{field.description}</p>
                        )}
                    </div>
                );

            default:
                log('Unsupported field type', { key, type: field.type }, path);
                return null;
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {Object.entries(schema.properties).map(([key, field]) => {
                log('Rendering field wrapper', { key, fieldType: field.type }, path);
                return (
                    <div key={[...path, key].join('.')}>
                        {renderField(key, field)}
                    </div>
                );
            })}
        </div>
    );
} 