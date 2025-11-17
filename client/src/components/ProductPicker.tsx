import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ProductPicker Component
 * Searchable dropdown for selecting products with intelligence metadata
 */

interface ProductPickerProps {
  value?: number | null;
  onSelect: (productId: number, productName: string) => void;
  placeholder?: string;
}

const stageColors = {
  concept: "bg-gray-500",
  development: "bg-blue-500",
  pre_launch: "bg-yellow-500",
  active_launch: "bg-green-500",
  post_launch: "bg-purple-500",
  cruise: "bg-cyan-500",
  end_of_life: "bg-red-500",
};

const stageLabels = {
  concept: "Concept",
  development: "Development",
  pre_launch: "Pre-Launch",
  active_launch: "Active Launch",
  post_launch: "Post-Launch",
  cruise: "Cruise",
  end_of_life: "End of Life",
};

export default function ProductPicker({ value, onSelect, placeholder = "Select product..." }: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const { data: products, isLoading } = trpc.intelligence.products.list.useQuery();

  const selectedProduct = products?.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>{selectedProduct.name}</span>
              <Badge variant="secondary" className={cn("text-xs", stageColors[selectedProduct.lifecycleState as keyof typeof stageColors])}>
                {stageLabels[selectedProduct.lifecycleState as keyof typeof stageLabels]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {selectedProduct.readinessScore}% ready
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading products..." : "No products found."}
            </CommandEmpty>
            <CommandGroup>
              {products?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name}-${product.id}`}
                  onSelect={() => {
                    onSelect(product.id, product.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="secondary" className={cn("text-xs", stageColors[product.lifecycleState as keyof typeof stageColors])}>
                      {stageLabels[product.lifecycleState as keyof typeof stageLabels]}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {product.readinessScore}% ready
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
