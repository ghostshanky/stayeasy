import React from 'react';
import { useOwnerProperties } from '../../client/src/hooks/useOwnerProperties';

const TestProperties: React.FC = () => {
  const { items, loading, error } = useOwnerProperties();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Properties Test</h2>
      <pre>{JSON.stringify(items, null, 2)}</pre>
    </div>
  );
};

export default TestProperties;