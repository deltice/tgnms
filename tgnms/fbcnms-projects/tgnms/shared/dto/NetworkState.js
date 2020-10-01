/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @format
 * @flow
 */

import {BinaryStarFsmStateValueMap} from '../types/Controller';
import type {SiteType, TopologyType} from '../types/Topology';
import type {StatusDumpType, UpgradeStateDumpType} from '../types/Controller';

export const HAPeerType = {
  PRIMARY: 'PRIMARY',
  BACKUP: 'BACKUP',
  ERROR: 'ERROR',
};

export const WAC_TYPES = {
  none: 'none',
  ruckus: 'ruckus',
};

export type NetworkInstanceConfig = {|
  id: number,
  name: string,
  controller_online: boolean,
  primary: E2EController,
  backup: ?E2EController,
  site_overrides: Array<SiteType>,
  offline_whitelist: ?OfflineWhiteListType,
  wireless_controller: ?WirelessController,
  map_profile_id: ?number,
|};

export type ServiceState = {|
  prometheus_online: boolean,
|};

export type ServerNetworkState = {|
  name: string,
  active: $Keys<typeof HAPeerType>,
  controller_ip: number,
  controller_ip_active: number,
  controller_version: string,
  controller_online: boolean,
  topology: TopologyType,
  topologyConfig: TopologyConfig,
  bounds: [[number, number], [number, number]],
  config_node_overrides: {overrides: string},
  config_auto_overrides: {overrides: string},
  high_availability: HAState,
  status_dump: StatusDumpType,
  ignition_state: IgnitionState,
  upgrade_state: UpgradeStateDumpType,
  // not sure if these are ever set.
  controller_error: ?string,
  wireless_controller_stats: {},
|};

export type NetworkState = {|
  ...ServerNetworkState,
  ...NetworkInstanceConfig,
  ...ServiceState,
|};

export type HAState = {|
  primary: {
    peerExpiry: number,
    state: ControllerHAState,
  },
  backup: {
    peerExpiry: number,
    state: ControllerHAState,
  },
|};

export type NetworkHealth = {
  startTime: number,
  endTime: number,
  events: {|
    [string]: LinkHealth,
  |},
};

export type LinkHealth = {
  events: Array<HealthEvent>,
  linkAlive: number,
  linkAvailForData: number,
};

export type HealthEvent = {|
  description: string,
  linkState: number,
  startTime: number,
  endTime: number,
|};

export type OfflineWhiteListType = {
  links: {|[string]: boolean|},
  nodes: {|[string]: boolean|},
};

export type WirelessController = {
  id?: number,
  type: 'none' | 'ruckus',
  url: string,
  username: string,
  password?: ?string,
};

export type WirelessControllerStats = {
  clientCount: number,
  lastSeenTime: number,
};

export type Coordinate = [number, number];

export type IgnitionState = {|
  igCandidates: Array<IgnitionCandidate>,
  igParams: {
    enable: boolean,
    linkAutoIgnite: {
      [string]: boolean,
    },
    linkUpDampenInterval: number,
    linkUpInterval: number,
  },
  lastIgCandidates: Array<IgnitionCandidate>,
|};

export type IgnitionCandidate = {|
  initiatorNodeName: string,
  linkName: string,
|};

export type E2EController = {|
  api_ip: string,
  api_port: number,
  controller_online?: boolean,
  e2e_ip?: string,
  e2e_port: number,
  id?: number,
|};

export type ControllerHAState = $Values<typeof BinaryStarFsmStateValueMap>;

export type TopologyConfig = $Shape<{|
  polarity: {},
  golay: {},
  controlSuperframe: {},
  channel: {},
|}>;

export type NetworkList = {|
  [string]: NetworkInstanceConfig,
|};