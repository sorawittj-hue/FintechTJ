import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DialogErrorFallback } from '@/components/ErrorFallback';
import { DepositDialog as DepositDialogBase } from './DepositDialog';
import { WithdrawDialog as WithdrawDialogBase } from './WithdrawDialog';
import { AlertDialog as AlertDialogBase } from './AlertDialog';
import { AddAssetDialog as AddAssetDialogBase } from './AddAssetDialog';
import { WithdrawAssetDialog as WithdrawAssetDialogBase } from './WithdrawAssetDialog';

interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositDialog({ isOpen, onClose }: BaseDialogProps) {
  return (
    <ErrorBoundary fallback={<DialogErrorFallback dialogName="Deposit" onClose={onClose} />} sectionName="DepositDialog">
      <DepositDialogBase isOpen={isOpen} onClose={onClose} />
    </ErrorBoundary>
  );
}

export function WithdrawDialog({ isOpen, onClose }: BaseDialogProps) {
  return (
    <ErrorBoundary fallback={<DialogErrorFallback dialogName="Withdraw" onClose={onClose} />} sectionName="WithdrawDialog">
      <WithdrawDialogBase isOpen={isOpen} onClose={onClose} />
    </ErrorBoundary>
  );
}

export function AlertDialog({ isOpen, onClose }: BaseDialogProps) {
  return (
    <ErrorBoundary fallback={<DialogErrorFallback dialogName="Price Alert" onClose={onClose} />} sectionName="AlertDialog">
      <AlertDialogBase isOpen={isOpen} onClose={onClose} />
    </ErrorBoundary>
  );
}

export function AddAssetDialog({ isOpen, onClose }: BaseDialogProps) {
  return (
    <ErrorBoundary fallback={<DialogErrorFallback dialogName="Add Asset" onClose={onClose} />} sectionName="AddAssetDialog">
      <AddAssetDialogBase isOpen={isOpen} onClose={onClose} />
    </ErrorBoundary>
  );
}

interface WithdrawAssetDialogProps extends BaseDialogProps {
  assetId: string | null;
}

export function WithdrawAssetDialog({ isOpen, onClose, assetId }: WithdrawAssetDialogProps) {
  return (
    <ErrorBoundary fallback={<DialogErrorFallback dialogName="Withdraw Asset" onClose={onClose} />} sectionName="WithdrawAssetDialog">
      <WithdrawAssetDialogBase isOpen={isOpen} onClose={onClose} assetId={assetId} />
    </ErrorBoundary>
  );
}

export default {
  DepositDialog,
  WithdrawDialog,
  AlertDialog,
  AddAssetDialog,
  WithdrawAssetDialog,
};
