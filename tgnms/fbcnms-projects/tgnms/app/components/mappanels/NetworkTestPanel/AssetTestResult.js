/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @format
 * @flow
 */

import AssetTestResultDetails from '../../../views/network_test/AssetTestResultDetails';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import IconButton from '@material-ui/core/IconButton';
import NetworkContext from '../../../contexts/NetworkContext';
import Paper from '@material-ui/core/Paper';
import React, {useMemo} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/styles';

import type {AssetTestResultType} from '../../../views/network_test/NetworkTestTypes';

const useResultStyles = makeStyles(theme => ({
  linkMissingAlert: {
    marginTop: theme.spacing(),
    padding: theme.spacing(),
    backgroundColor: theme.palette.grey[200],
  },
  assetName: {
    fontWeight: 'bold',
  },
}));

export default function AssetTestResult({
  assetName,
  executionResults,
}: {
  assetName: string,
  executionResults: Array<AssetTestResultType>,
}) {
  const classes = useResultStyles();
  const {removeElement, selectedElement} = React.useContext(NetworkContext);
  const executionResultsRef = React.useRef(executionResults);

  const testResult: ?AssetTestResultType = useMemo(() => {
    const currentExecutionResults = executionResultsRef.current;
    const linkResults =
      currentExecutionResults &&
      currentExecutionResults.find(result => result.assetName === assetName)
        ?.results;
    // we expect a test result for each side of the link
    if (!linkResults || linkResults.length < 2) {
      return null;
    }
    return {
      assetName: assetName,
      results: linkResults,
    };
  }, [executionResultsRef, assetName]);

  const handleBack = React.useCallback(() => {
    if (selectedElement) {
      removeElement(selectedElement?.type, selectedElement?.name);
    }
  }, [removeElement, selectedElement]);

  return (
    <>
      <Typography variant="body1">
        <IconButton
          size="small"
          data-testid="back-button"
          onClick={handleBack}
          color="secondary">
          <ChevronLeftIcon />
        </IconButton>
        {assetName}
      </Typography>
      {testResult ? (
        <AssetTestResultDetails results={testResult.results} />
      ) : (
        <Paper className={classes.linkMissingAlert} elevation={0}>
          <Typography variant="body1">
            Could not find test results for{' '}
            <span className={classes.assetName}>{assetName}</span>. The link may
            have been unavailable during this test execution.
          </Typography>
        </Paper>
      )}
    </>
  );
}