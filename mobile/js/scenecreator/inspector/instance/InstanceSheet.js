import React from 'react';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { InstanceLayout } from './InstanceLayout';

export const InstanceSheet = ({ isOpen }) => {
  const renderHeader = () => <BottomSheetHeader title="Layout" closeable={false} />;
  const renderContent = () => <InstanceLayout />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      initialSnap={0}
    />
  );
};
