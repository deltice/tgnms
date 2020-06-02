/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @format
 * @flow strict-local
 */

import 'jest-dom/extend-expect';
import HealthTextSquare from '../HealthTextSquare';
import MaterialTheme from '../../../MaterialTheme';
import React from 'react';
import {render} from '@testing-library/react';

const defaultProps = {
  text: 'testText',
  health: 0,
};

test('renders', () => {
  const {getByText} = render(
    <MaterialTheme>
      <HealthTextSquare {...defaultProps} />
    </MaterialTheme>,
  );
  expect(getByText('TESTTEXT')).toBeInTheDocument();
});