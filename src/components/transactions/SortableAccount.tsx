import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown,
  Building2,
  CreditCard,
  Landmark,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/mockData";

interface Account {
  id: string;
  name: string;
  institution: string;
  type: string;
  balance: number;
}

interface SortableAccountProps {
  account: Account;
  isOpen: boolean;
  onToggle: () => void;
  transactionCount: number;
  children: ReactNode;
}

function getAccountIcon(type: string) {
  switch (type) {
    case "checking":
      return <Building2 className="h-5 w-5" />;
    case "credit":
      return <CreditCard className="h-5 w-5" />;
    case "savings":
      return <Landmark className="h-5 w-5" />;
    default:
      return <Building2 className="h-5 w-5" />;
  }
}

export function SortableAccount({
  account,
  isOpen,
  onToggle,
  transactionCount,
  children,
}: SortableAccountProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card",
          isDragging && "shadow-lg opacity-90"
        )}
      >
        {/* Account Header */}
        <div className="flex w-full items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-2 hover:bg-secondary rounded"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  account.type === 'credit' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  {getAccountIcon(account.type)}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{account.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{account.institution}</p>
                </div>
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-4">
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  account.balance >= 0 ? "text-foreground" : "text-destructive"
                )}>
                  {formatCurrency(account.balance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
}