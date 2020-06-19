import React from 'react';

import BottomSheetHeader from './BottomSheetHeader';
import CardCreatorBottomSheet from './CardCreatorBottomSheet';

export default BlueprintsSheet = ({ element, isOpen, onClose, context }) => {
  const renderHeader = () => <BottomSheetHeader title="Blueprints" onClose={onClose} />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      element={element}
      context={context}
      renderHeader={renderHeader}
    />
  );
};
