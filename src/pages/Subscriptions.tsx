import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSettings } from '../hooks/useSettings';
import { PageHeader } from '../components/layout/PageHeader';
import { SubscriptionCard } from '../components/subscriptions/SubscriptionCard';
import { AlternativesModal } from '../components/subscriptions/AlternativesModal';
import { ProofVaultModal } from '../components/subscriptions/ProofVaultModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Subscription, Category, BillingCycle, SubscriptionStatus } from '../types/subscription';
import { CATEGORIES } from '../data/categories';
import {
  Search,
  Filter,
  PlusCircle,
  ArrowUpDown,
  CreditCard,
  Ban,
  Trash2,
  Sparkles,
  Download,
} from 'lucide-react';
import { exportToCSV, exportToJSON } from '../lib/export';

export const SubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    subscriptions,
    deleteSubscription,
    markAsCancelled,
    markAsPaused,
    markAsActive,
    loadSampleData,
    editSubscription,
  } = useSubscriptions();
  const { settings } = useSettings();
  const { showToast } = useToast();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [cycleFilter, setCycleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'renewal' | 'price' | 'name'>('renewal');

  // Modals state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [cancelTargetSub, setCancelTargetSub] = useState<Subscription | null>(null);
  const [alternativesSub, setAlternativesSub] = useState<Subscription | null>(null);
  const [proofVaultSub, setProofVaultSub] = useState<Subscription | null>(null);

  // Cancellation prompt form inside modal
  const [cancelRef, setCancelRef] = useState('');
  const [cancelNote, setCancelNote] = useState('');

  // Filter & sort logic
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // Search
        const q = search.toLowerCase().trim();
        if (
          q &&
          !sub.name.toLowerCase().includes(q) &&
          !sub.category.toLowerCase().includes(q) &&
          !(sub.notes || '').toLowerCase().includes(q)
        ) {
          return false;
        }

        // Category
        if (categoryFilter !== 'All' && sub.category !== categoryFilter) return false;

        // Billing Cycle
        if (cycleFilter !== 'All' && sub.billingCycle !== cycleFilter) return false;

        // Status
        if (statusFilter !== 'All') {
          if (statusFilter === 'trial' && !sub.isFreeTrial) return false;
          if (statusFilter !== 'trial' && sub.status !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'price') {
          return b.price - a.price;
        } else {
          // Renewal date
          const dateA = a.isFreeTrial && a.trialEndDate ? a.trialEndDate : a.nextRenewalDate;
          const dateB = b.isFreeTrial && b.trialEndDate ? b.trialEndDate : b.nextRenewalDate;
          return dateA.localeCompare(dateB);
        }
      });
  }, [subscriptions, search, categoryFilter, cycleFilter, statusFilter, sortBy]);

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteSubscription(deleteTargetId);
      showToast('Subscription removed.', 'info');
      setDeleteTargetId(null);
    }
  };

  const confirmCancel = () => {
    if (cancelTargetSub) {
      markAsCancelled(cancelTargetSub.id, {
        referenceNumber: cancelRef.trim() || undefined,
        note: cancelNote.trim() || undefined,
      });
      showToast(`${cancelTargetSub.name} marked as cancelled. Saved to history!`, 'success');
      setCancelTargetSub(null);
      setCancelRef('');
      setCancelNote('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subscriptions"
        description="Filter, sort, monitor price history, and manage all your recurring services in one place."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => {
                exportToCSV(subscriptions);
                showToast('Exported subscriptions to CSV', 'info');
              }}
            >
              Export CSV
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/add')}
            >
              Add Subscription
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111A40] border border-[#26336B] shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-5 relative">
            <Search className="w-4 h-4 text-[#60A5FA] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by service name, category, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="All" className="bg-[#111A40]">All Statuses</option>
              <option value="active" className="bg-[#111A40]">Active</option>
              <option value="trial" className="bg-[#111A40]">Free Trials</option>
              <option value="paused" className="bg-[#111A40]">Paused</option>
              <option value="cancelled" className="bg-[#111A40]">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="All" className="bg-[#111A40]">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#111A40]">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cycle Filter */}
          <div className="lg:col-span-1.5">
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="All" className="bg-[#111A40]">All Cycles</option>
              <option value="Weekly" className="bg-[#111A40]">Weekly</option>
              <option value="Monthly" className="bg-[#111A40]">Monthly</option>
              <option value="Quarterly" className="bg-[#111A40]">Quarterly</option>
              <option value="Yearly" className="bg-[#111A40]">Yearly</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="renewal" className="bg-[#111A40]">Next Renewal</option>
              <option value="price" className="bg-[#111A40]">Highest Price</option>
              <option value="name" className="bg-[#111A40]">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter tags pill row */}
        {(search || categoryFilter !== 'All' || cycleFilter !== 'All' || statusFilter !== 'All') && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#26336B]/60 text-xs text-[#9AA6D6]">
            <span>Active filters:</span>
            {search && (
              <span className="px-2 py-0.5 rounded-full bg-[#18234F] text-[#60A5FA] border border-[#26336B]">
                "{search}"
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="px-2 py-0.5 rounded-full bg-[#18234F] text-[#60A5FA] border border-[#26336B]">
                Status: {statusFilter}
              </span>
            )}
            {categoryFilter !== 'All' && (
              <span className="px-2 py-0.5 rounded-full bg-[#18234F] text-[#60A5FA] border border-[#26336B]">
                Category: {categoryFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('All');
                setCycleFilter('All');
                setStatusFilter('All');
              }}
              className="text-[#60A5FA] hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Grid of Subscriptions */}
      {filteredSubscriptions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-[#60A5FA]" />}
          title="No subscriptions match your query"
          description="Try broadening your search or filter options, or add a new recurring subscription."
          action={
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/add')}
            >
              Add New Subscription
            </Button>
          }
          secondaryAction={
            subscriptions.length === 0 ? (
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={loadSampleData}
              >
                Load Sample Data
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onDelete={(id) => setDeleteTargetId(id)}
              onCancel={() => setCancelTargetSub(sub)}
              onPause={(id) => {
                markAsPaused(id);
                showToast(`Paused ${sub.name}.`, 'info');
              }}
              onResume={(id) => {
                markAsActive(id);
                showToast(`Resumed ${sub.name}.`, 'success');
              }}
              onShowAlternatives={(s) => setAlternativesSub(s)}
              onShowProofVault={(s) => setProofVaultSub(s)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Subscription"
        description="Are you sure you want to delete this subscription from SubTrack?"
      >
        <div className="space-y-4 text-xs text-[#9AA6D6]">
          <p>
            If you have cancelled this service with the provider, consider using{' '}
            <strong className="text-[#60A5FA]">"Mark as Cancelled"</strong> instead. That keeps your
            cancellation history, calculates money saved, and stores proof in the vault.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#26336B]/60">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark As Cancelled Modal */}
      <Modal
        isOpen={!!cancelTargetSub}
        onClose={() => setCancelTargetSub(null)}
        title={`Cancel ${cancelTargetSub?.name || 'Subscription'}`}
        description="Marking as cancelled records money saved and stores confirmation details."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
              Confirmation / Reference Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. CANC-2026-X or Ticket #"
              value={cancelRef}
              onChange={(e) => setCancelRef(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] font-mono focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
              Cancellation Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cancelled via account settings. UPI mandate revoked."
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#26336B]/60">
            <Button variant="ghost" size="sm" onClick={() => setCancelTargetSub(null)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={confirmCancel}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Alternatives Modal */}
      <AlternativesModal
        subscription={alternativesSub}
        isOpen={!!alternativesSub}
        onClose={() => setAlternativesSub(null)}
      />

      {/* Proof Vault Modal */}
      <ProofVaultModal
        subscription={proofVaultSub}
        isOpen={!!proofVaultSub}
        onClose={() => setProofVaultSub(null)}
        onSaveProof={(id, proof) => {
          editSubscription(id, { proofOfCancellation: { cancelledAt: new Date().toISOString(), ...proof } });
          showToast('Proof vault updated!', 'success');
        }}
      />
    </div>
  );
};
