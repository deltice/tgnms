/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @format
 * @flow
 */
import * as React from 'react';
import * as networkPlanningAPIUtil from '@fbcnms/tg-nms/app/apiutils/NetworkPlanningAPIUtil';
import useTaskState, {TASK_STATE} from '@fbcnms/tg-nms/app/hooks/useTaskState';
import {PLANNING_FOLDER_PATH} from '@fbcnms/tg-nms/app/constants/paths';
import {matchPath, useLocation} from 'react-router-dom';
import {useNetworkPlanningContext} from '@fbcnms/tg-nms/app/contexts/NetworkPlanningContext';

import type {CreateANPPlanRequest} from '@fbcnms/tg-nms/shared/dto/ANP';

export function usePlanFormState(): {|
  planState: CreateANPPlanRequest,
  updatePlanState: (update: $Shape<CreateANPPlanRequest>) => void,
  setPlanFormState: (state: $Shape<CreateANPPlanRequest>) => void,
|} {
  const [planState, setPlanFormState] = React.useState<
    $Shape<CreateANPPlanRequest>,
  >({});
  const updatePlanState = React.useCallback(
    (update: $Shape<CreateANPPlanRequest>) =>
      setPlanFormState(curr => ({
        ...curr,
        ...update,
      })),
    [],
  );

  return {
    planState,
    updatePlanState,
    setPlanFormState,
  };
}

export function usePlanningFolderId(): string {
  const location = useLocation();
  const match = matchPath(location.pathname, {
    path: PLANNING_FOLDER_PATH,
  });
  return match?.params?.folderId ?? '';
}

/**
 * Loads the folders list if it's not already cached
 */
export function useFolders() {
  const {folders, setFolders} = useNetworkPlanningContext();
  const loadfoldersTask = useTaskState();
  React.useEffect(() => {
    (async () => {
      try {
        if (folders == null) {
          loadfoldersTask.setState(TASK_STATE.LOADING);
          const _folders = await networkPlanningAPIUtil.getFolders();
          const folderLookup = _folders.reduce((map, folder) => {
            map[folder.id] = folder;
            return map;
          }, {});
          setFolders(folderLookup);
          loadfoldersTask.setState(TASK_STATE.SUCCESS);
        }
      } catch (err) {
        loadfoldersTask.setState(TASK_STATE.ERROR);
      }
    })();
  }, [setFolders, folders, loadfoldersTask]);

  return {
    folders,
    setFolders,
    taskState: loadfoldersTask,
  };
}