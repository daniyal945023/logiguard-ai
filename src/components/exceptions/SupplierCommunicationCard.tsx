import { Copy, Mail, MessageSquare, Phone } from 'lucide-react';

import { SectionCard } from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Exception } from '@/types/logistics';

const channelMeta = {
  email: { label: 'Email', icon: Mail },
  phone: { label: 'Phone call', icon: Phone },
  portal: { label: 'Supplier portal', icon: MessageSquare },
} as const;

interface SupplierCommunicationCardProps {
  message: Exception['supplierMessage'];
}

export function SupplierCommunicationCard({ message }: SupplierCommunicationCardProps) {
  const { toast } = useToast();
  const channel = channelMeta[message.channel];

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(`Subject: ${message.subject}\n\n${message.body}`);
      toast({ title: 'Draft copied', description: 'Paste it into your supplier email or call notes.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the draft text and copy it manually.', variant: 'destructive' });
    }
  }

  return (
    <SectionCard
      title="Supplier communication"
      description="Recommended outreach based on the exception"
      action={
        <Button variant="outline" size="sm" className="gap-2" onClick={copyDraft}>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy draft
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <channel.icon className="h-4 w-4 text-primary" aria-hidden="true" />
          Recommended channel: <span className="font-medium text-foreground">{channel.label}</span>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-4">
          <p className="text-sm font-medium text-foreground">{message.subject}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message.body}</p>
        </div>
      </div>
    </SectionCard>
  );
}
