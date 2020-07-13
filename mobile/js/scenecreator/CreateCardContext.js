import * as React from 'react';

export const CreateCardContext = React.createContext({});
export const useCardCreator = () => React.useContext(CreateCardContext);
