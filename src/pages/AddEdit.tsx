import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { PageHeader } from '../components/layout/PageHeader';
import { SubscriptionForm } from '../components/subscriptions/SubscriptionForm';
import { SmartImportModal } from '../components/subscriptions/SmartImportModal';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const AddEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subscriptions, addSubscription, editSubscription } = useSubscriptions();
  const { showToast } = useToast();

  const isEditing = Boolean(id);
  const existingSub = isEditing ? subscriptions.find((s) => s.id === id) : undefined;

  const [showSmartModal, setShowSmartModal] = useState(searchParams.get('tab') === 'smart');

  const handleSubmit = (data: any) => {
    if (isEditing && id) {
      editSubscription(id, data);
      showToast(`Updated ${data.name} successfully!`, 'success');
      navigate('/subscriptions');
    } else {
      addSubscription(data);
      showToast(`Added ${data.name} to SubTrack!`, 'success');
      navigate('/subscriptions');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-[#60A5FA] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4 text-[#8B5CF6]" />}
            onClick={() => setShowSmartModal(true)}
          >
            Use Smart Import (AI)
          </Button>
        )}
      </div>

      <PageHeader
        title={isEditing ? `Edit ${existingSub?.name || 'Subscription'}` : 'Add Subscription'}
        description={
          isEditing
            ? 'Update pricing, billing cycle, renewal dates, or family split count.'
            : 'Track a new recurring subscription, membership, or free-trial.'
        }
      />

      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-xl">
        <SubscriptionForm
          initialValues={existingSub}
          onSubmit={handleSubmit}
          isEditing={isEditing}
        />
      </div>

      <SmartImportModal
        isOpen={showSmartModal}
        onClose={() => setShowSmartModal(false)}
        onSave={(data) => {
          addSubscription({
            name: data.name,
            category: data.category,
            price: data.price,
            currency: data.currency,
            billingCycle: data.billingCycle,
            startDate: new Date().toISOString().split('T')[0],
            nextRenewalDate:
              data.nextRenewalDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: data.isFreeTrial ? 'trial' : 'active',
            isFreeTrial: Boolean(data.isFreeTrial),
            reminderDaysBefore: data.billingCycle === 'Yearly' ? 7 : 2,
            splitCount: 1,
            priceHistory: [
              {
                id: 'ph_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                price: data.price,
                currency: data.currency,
                reason: 'Imported via Smart Import',
              },
            ],
            notes: data.notes,
          });
          showToast(`Added ${data.name} to SubTrack!`, 'success');
          navigate('/subscriptions');
        }}
      />
    </div>
  );
};
