"use client";

import * as React from 'react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Package,
  Plus,
  Trash2,
  Check,
  Save,
  BedDouble,
  Sofa,
  Lamp,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useHostel } from '@/features/hostels';

// ============================================================================
// INVENTORY TYPES
// ============================================================================

interface InventoryItem {
  id: string;
  name: string;
  category: 'bed' | 'furniture' | 'utilities' | 'custom';
  perBed: boolean;
  quantity: number;
  price?: number; // Replacement cost
  condition?: 'new' | 'good' | 'fair' | 'needs_replacement';
  isDefault: boolean;
}

interface RoomTypeInventory {
  roomTypeName: string;
  bedsPerRoom: number;
  items: InventoryItem[];
}

// Default templates
const defaultBedItems: Omit<InventoryItem, 'id'>[] = [
  { name: 'Mattress', category: 'bed', perBed: true, quantity: 1, isDefault: true },
  { name: 'Bed Frame', category: 'bed', perBed: true, quantity: 1, isDefault: true },
  { name: 'Pillow', category: 'bed', perBed: true, quantity: 1, isDefault: true },
  { name: 'Bedsheet Set', category: 'bed', perBed: true, quantity: 1, isDefault: true },
  { name: 'Blanket', category: 'bed', perBed: true, quantity: 1, isDefault: true },
];

const defaultFurnitureItems: Omit<InventoryItem, 'id'>[] = [
  { name: 'Study Desk', category: 'furniture', perBed: true, quantity: 1, isDefault: true },
  { name: 'Chair', category: 'furniture', perBed: true, quantity: 1, isDefault: true },
  { name: 'Wardrobe Space', category: 'furniture', perBed: true, quantity: 1, isDefault: true },
  { name: 'Mirror', category: 'furniture', perBed: false, quantity: 1, isDefault: true },
  { name: 'Waste Bin', category: 'furniture', perBed: false, quantity: 1, isDefault: true },
];

const defaultUtilitiesItems: Omit<InventoryItem, 'id'>[] = [
  { name: 'Ceiling Light', category: 'utilities', perBed: false, quantity: 1, isDefault: true },
  { name: 'Power Socket', category: 'utilities', perBed: false, quantity: 2, isDefault: true },
  { name: 'Light Switch', category: 'utilities', perBed: false, quantity: 1, isDefault: true },
  { name: 'Window Curtains', category: 'utilities', perBed: false, quantity: 1, isDefault: true },
];

// Generate unique IDs
const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Initialize default inventory
const initializeDefaultInventory = (): InventoryItem[] => {
  return [
    ...defaultBedItems.map(item => ({ ...item, id: generateId() })),
    ...defaultFurnitureItems.map(item => ({ ...item, id: generateId() })),
    ...defaultUtilitiesItems.map(item => ({ ...item, id: generateId() })),
  ];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InventoryPage() {
  const params = useParams();
  const hostelId = params.id as string;
  
  const { data: hostel, isLoading: hostelLoading } = useHostel(hostelId);
  
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [inventory, setInventory] = useState<InventoryItem[]>(initializeDefaultInventory);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom item form state
  const [customItem, setCustomItem] = useState({
    name: '',
    perBed: false,
    quantity: 1,
    price: 0,
  });

  // Toggle item inclusion
  const toggleItem = useCallback((itemId: string) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: item.quantity > 0 ? 0 : 1 }
        : item
    ));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: Math.max(0, quantity) }
        : item
    ));
  }, []);

  // Toggle per-bed setting
  const togglePerBed = useCallback((itemId: string) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, perBed: !item.perBed }
        : item
    ));
  }, []);

  // Delete custom item
  const deleteItem = useCallback((itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed');
  }, []);

  // Add custom item
  const handleAddCustomItem = useCallback(() => {
    if (!customItem.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    const newItem: InventoryItem = {
      id: generateId(),
      name: customItem.name.trim(),
      category: 'custom',
      perBed: customItem.perBed,
      quantity: customItem.quantity,
      price: customItem.price || undefined,
      isDefault: false,
    };

    setInventory(prev => [...prev, newItem]);
    setCustomItem({ name: '', perBed: false, quantity: 1, price: 0 });
    setIsAddingCustom(false);
    toast.success(`Added "${newItem.name}" to inventory`);
  }, [customItem]);

  // Save inventory template
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Call API to save inventory template
      // await saveInventoryTemplate(hostelId, inventory);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Inventory template saved!');
    } catch (error) {
      toast.error('Failed to save inventory');
    } finally {
      setIsSaving(false);
    }
  }, [inventory]);

  // Group items by category
  const itemsByCategory = React.useMemo(() => {
    return {
      bed: inventory.filter(item => item.category === 'bed'),
      furniture: inventory.filter(item => item.category === 'furniture'),
      utilities: inventory.filter(item => item.category === 'utilities'),
      custom: inventory.filter(item => item.category === 'custom'),
    };
  }, [inventory]);

  // Count active items
  const activeItemsCount = inventory.filter(item => item.quantity > 0).length;

  if (hostelLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/landlord/hostels/${hostelId}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Hostel
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {hostel?.name || 'Loading...'} - Define what items are in each room
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⌛</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-info/20 bg-info/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">
              How this works
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This inventory template will be used when students check in. The caretaker will verify each item's condition and take photos. You can add or remove items anytime.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeItemsCount}</p>
                <p className="text-sm font-medium text-muted-foreground">Active Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <BedDouble className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{itemsByCategory.bed.length}</p>
                <p className="text-sm font-medium text-muted-foreground">Bed Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Sofa className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{itemsByCategory.furniture.length}</p>
                <p className="text-sm font-medium text-muted-foreground">Furniture</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Lamp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{itemsByCategory.utilities.length + itemsByCategory.custom.length}</p>
                <p className="text-sm font-medium text-muted-foreground">Utilities & Custom</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Categories */}
      <div className="space-y-6">
        {/* Bed Items */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <BedDouble className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Bed Items</h3>
                  <p className="text-sm text-muted-foreground">{itemsByCategory.bed.length} items</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-bold">
                {itemsByCategory.bed.filter(i => i.quantity > 0).length} / {itemsByCategory.bed.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {itemsByCategory.bed.map(item => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                  onPerBedToggle={() => togglePerBed(item.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Furniture */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Sofa className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Furniture</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {itemsByCategory.furniture.length} items
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="font-bold">
                {itemsByCategory.furniture.filter(i => i.quantity > 0).length} / {itemsByCategory.furniture.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {itemsByCategory.furniture.map(item => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                  onPerBedToggle={() => togglePerBed(item.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Utilities */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Lamp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Utilities</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Lights, sockets, and fixtures
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="font-bold">
                {itemsByCategory.utilities.filter(i => i.quantity > 0).length} / {itemsByCategory.utilities.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {itemsByCategory.utilities.map(item => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                  onPerBedToggle={() => togglePerBed(item.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Items */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Custom Items</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Additional items specific to your hostel
                  </CardDescription>
                </div>
              </div>
              <Dialog open={isAddingCustom} onOpenChange={setIsAddingCustom}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add Custom Item</DialogTitle>
                    <DialogDescription>
                      Add an item that's specific to your hostel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemName" className="text-base font-bold">
                        Item Name *
                      </Label>
                      <Input
                        id="itemName"
                        placeholder="e.g., Reading Lamp, Water Heater, Fan"
                        value={customItem.name}
                        onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="itemQty" className="text-base font-bold">
                          Quantity
                        </Label>
                        <Input
                          id="itemQty"
                          type="number"
                          min="1"
                          value={customItem.quantity}
                          onChange={(e) => setCustomItem(prev => ({ 
                            ...prev, 
                            quantity: parseInt(e.target.value) || 1 
                          }))}
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="itemPrice" className="text-base font-bold">
                          Replacement Cost (KES)
                        </Label>
                        <Input
                          id="itemPrice"
                          type="number"
                          min="0"
                          placeholder="Optional"
                          value={customItem.price || ''}
                          onChange={(e) => setCustomItem(prev => ({ 
                            ...prev, 
                            price: parseInt(e.target.value) || 0 
                          }))}
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-lg border">
                      <Switch
                        id="perBed"
                        checked={customItem.perBed}
                        onCheckedChange={(checked) => setCustomItem(prev => ({ 
                          ...prev, 
                          perBed: checked 
                        }))}
                      />
                      <Label htmlFor="perBed" className="text-base font-medium cursor-pointer">
                        One per bed (multiply by number of beds in room)
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingCustom(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCustomItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {itemsByCategory.custom.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">No custom items yet</p>
                <p className="text-sm">Click "Add Item" to add hostel-specific items</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {itemsByCategory.custom.map(item => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleItem(item.id)}
                    onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                    onPerBedToggle={() => togglePerBed(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    showDelete
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// INVENTORY ITEM ROW COMPONENT
// ============================================================================

interface InventoryItemRowProps {
  item: InventoryItem;
  onToggle: () => void;
  onQuantityChange: (qty: number) => void;
  onPerBedToggle: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

function InventoryItemRow({
  item,
  onToggle,
  onQuantityChange,
  onPerBedToggle,
  onDelete,
  showDelete,
}: InventoryItemRowProps) {
  const isActive = item.quantity > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        isActive ? "border-primary/30 bg-primary/5" : "border-muted bg-muted/30 opacity-60"
      )}
    >
      <Checkbox
        checked={isActive}
        onCheckedChange={onToggle}
        className="h-5 w-5"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-base font-semibold truncate",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}>
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className={cn(
              "text-xs cursor-pointer transition-colors",
              item.perBed && "bg-info/10 border-info/20 text-info"
            )}
            onClick={onPerBedToggle}
          >
            {item.perBed ? 'Per Bed' : 'Per Room'}
          </Badge>
          {item.price && (
            <span className="text-xs text-muted-foreground">
              KES {item.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 0}
          >
            -
          </Button>
          <span className="w-8 text-center font-bold text-foreground">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(item.quantity + 1)}
          >
            +
          </Button>
        </div>
        {showDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
