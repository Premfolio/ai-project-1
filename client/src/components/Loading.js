import React from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid #ffffff;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: white;
  margin-top: 20px;
  font-size: 18px;
  font-weight: 500;
`;

const Loading = () => {
  return (
    <LoadingContainer>
      <div style={{ textAlign: 'center' }}>
        <Spinner />
        <LoadingText>Loading...</LoadingText>
      </div>
    </LoadingContainer>
  );
};

export default Loading; 