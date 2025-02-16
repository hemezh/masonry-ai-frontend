'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { PencilIcon, SwatchIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Column, COLUMN_COLORS, TEXT_COLORS } from './types';
import { ColumnType } from '@/lib/api/tables';

interface ColumnMenuProps {
  column?: Column;
  onRename?: (column: Column, newName: string) => void;
  onUpdateColor?: (columnId: string, color: string) => void;
  onUpdateTextColor?: (columnId: string, textColor: string) => void;
  onAddColumn?: (data: { name: string; type: ColumnType; description?: string }) => void;
  isAddingColumn?: boolean;
}

export function ColumnMenu({ 
  column, 
  onRename, 
  onUpdateColor, 
  onUpdateTextColor,
  onAddColumn,
  isAddingColumn,
}: ColumnMenuProps) {
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>('s');
  const [newColumnDescription, setNewColumnDescription] = useState('');
  const [renamingName, setRenamingName] = useState('');
  const isAddMode = !column;

  const handleAddColumn = () => {
    if (!newColumnName || !onAddColumn) return;
    onAddColumn({
      name: newColumnName,
      type: newColumnType,
      description: newColumnDescription || undefined,
    });
    setNewColumnName('');
    setNewColumnType('s');
    setNewColumnDescription('');
  };

  const handleRename = () => {
    if (!renamingName || !column || !onRename) return;
    onRename(column, renamingName);
    setRenamingName('');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`p-1 rounded-md hover:bg-accent/50 transition-colors hover:opacity-100 ${
            isAddMode ? 'text-muted-foreground hover:text-primary hover:bg-accent/10' : ''
          }`}
        >
          {isAddMode ? (
            <PlusIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {isAddMode ? (
          <DropdownMenuGroup className="px-2 py-2 space-y-2">
            <DropdownMenuLabel>Add New Column</DropdownMenuLabel>
            <div className="space-y-2">
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name"
                className="h-8"
              />
              <Select value={newColumnType} onValueChange={(value: ColumnType) => setNewColumnType(value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s">String</SelectItem>
                  <SelectItem value="i">Integer</SelectItem>
                  <SelectItem value="f">Float</SelectItem>
                  <SelectItem value="d">DateTime</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={newColumnDescription}
                onChange={(e) => setNewColumnDescription(e.target.value)}
                placeholder="Optional description"
                className="h-8"
              />
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName || isAddingColumn}
                className="w-full h-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingColumn ? 'Adding...' : 'Add Column'}
              </button>
            </div>
          </DropdownMenuGroup>
        ) : (
          <>
            <div className="px-2 py-2">
              <div className="flex items-center space-x-2">
                <Input
                  value={renamingName}
                  onChange={(e) => setRenamingName(e.target.value)}
                  placeholder={column?.header}
                  className="h-8"
                />
                <button
                  onClick={handleRename}
                  disabled={!renamingName}
                  className="h-8 px-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SwatchIcon className="h-4 w-4 mr-2" />
                Set Background Color
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1">
                <div className="grid grid-cols-4 gap-1">
                  {COLUMN_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-md border transition-all ${
                        column?.color === color.value ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ 
                        background: color.value || 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                      }}
                      title={color.name}
                      onClick={() => onUpdateColor?.(column!.id, color.value)}
                    />
                  ))}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SwatchIcon className="h-4 w-4 mr-2" />
                Set Text Color
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1">
                <div className="grid grid-cols-4 gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-md border transition-all ${
                        column?.textColor === color.value ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ 
                        background: color.value || 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                      }}
                      title={color.name}
                      onClick={() => onUpdateTextColor?.(column!.id, color.value)}
                    />
                  ))}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
