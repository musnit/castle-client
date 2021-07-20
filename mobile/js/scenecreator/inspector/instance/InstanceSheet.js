import React, { useEffect, useState } from 'react';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { InstanceLayout } from './InstanceLayout';

export const InstanceSheet = ({ isOpen, addChildSheet, onClose }) => {
  const renderHeader = () => <BottomSheetHeader title="Layout" onClose={onClose} />;
  const renderContent = () => <InstanceLayout />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
