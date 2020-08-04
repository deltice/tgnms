/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 * @format
 */

import {
  ANP_NODE_TYPE,
  ANP_STATUS_TYPE,
  SECTOR_DEFAULT,
  kmlAnpStatus,
  kmlFeatureType,
  kmlSiteType,
} from '../constants/TemplateConstants';
import {LinkTypeValueMap, NodeTypeValueMap} from '../../shared/types/Topology';
import {apiServiceRequest} from '../apiutils/ServiceAPIUtil';
import {convertType, objectValuesTypesafe} from './ObjectHelpers';

import type {
  AnpLink,
  AnpLinkUploadKmlType,
  AnpNode,
  AnpSite,
  AnpSiteUploadKmlType,
  AnpUploadTopologyType,
  ApiBuilerInput,
  LinkTemplate,
  NodeTemplate,
  UploadTopologyType,
} from '../constants/TemplateConstants';
import type {LinkType, NodeType, SiteType} from '../../shared/types/Topology';

function createLinkData(overrides?: LinkTemplate): $Shape<LinkType> {
  return {
    a_node_name: overrides?.a_node_name || '',
    z_node_name: overrides?.z_node_name || '',
    link_type: LinkTypeValueMap.WIRELESS,
    is_alive: false,
    linkup_attempts: 0,
    is_backup_cn_link: false,
  };
}

function createNodeData(overrides?: $Shape<NodeType>): $Shape<NodeType> {
  return {
    name: overrides?.name || '',
    node_type: overrides?.node_type || NodeTypeValueMap.DN,
    is_primary: overrides?.is_primary || true,
    pop_node: overrides?.pop_node || false,
    site_name: overrides?.site_name || '',
    ant_azimuth: overrides?.ant_azimuth || 0,
    ant_elevation: overrides?.ant_elevation || 0,
  };
}

export function templateTopologyBuilderRequest(input: ApiBuilerInput) {
  const {template, networkName, onClose} = input;
  const links = [];
  const nodes = template.nodes.map((nodeTemplate, index) => {
    const siteName = template.site.name;
    nodeTemplate.name = siteName + '_' + (index + 1);
    nodeTemplate.site_name = siteName;

    nodeTemplate.links?.forEach(linkTemplate => {
      if (linkTemplate.z_node_name !== 'none') {
        links.push(createLinkData(linkTemplate));
      }
    });

    return createNodeData(nodeTemplate);
  });

  const data = {
    sites: [template.site],
    nodes,
    links,
  };

  apiServiceRequest(networkName, 'bulkAdd', data)
    .then(_result => {
      onClose('success');
    })
    .catch(error => onClose(error.message));
}

export function uploadTopologyBuilderRequest(
  data: UploadTopologyType,
  networkName: string,
  onClose: (message?: string) => void,
) {
  apiServiceRequest(networkName, 'bulkAdd', data)
    .then(_result => onClose('success'))
    .catch(error => onClose(error.message));
}

export function parseAnpJson(input: AnpUploadTopologyType) {
  const sites = objectValuesTypesafe<AnpSite>(input.sites)
    .filter(
      site =>
        site.status_type === ANP_STATUS_TYPE.PROPOSED ||
        site.status_type === ANP_STATUS_TYPE.EXISTING,
    )
    .map<SiteType>(site => ({
      name: site.site_id,
      location: site.loc,
    }));
  const nodes = objectValuesTypesafe<AnpNode>(input.nodes)
    .filter(
      node =>
        node.status_type === ANP_STATUS_TYPE.PROPOSED ||
        node.status_type === ANP_STATUS_TYPE.EXISTING,
    )
    .map<NodeTemplate>(node => ({
      name: node.node_id,
      node_type:
        node.node_type === ANP_NODE_TYPE.CN
          ? ANP_NODE_TYPE.CN
          : ANP_NODE_TYPE.DN,
      is_primary: node.is_primary,
      pop_node: node.node_type === ANP_NODE_TYPE.DN_POP_CONNECTION,
      site_name: node.site_id,
      ant_azimuth: node.ant_azimuth,
      ant_elevation: node.ant_elevation,
    }));
  const links = objectValuesTypesafe<AnpLink>(input.links)
    .filter(
      link =>
        link.status_type === ANP_STATUS_TYPE.PROPOSED ||
        link.status_type === ANP_STATUS_TYPE.EXISTING,
    )
    .map<LinkTemplate>(link => ({
      a_node_name: link.tx_node_id,
      z_node_name: link.rx_node_id,
    }));

  return {sites, nodes, links};
}

export function parseAnpKml(
  input: Array<AnpSiteUploadKmlType | AnpLinkUploadKmlType>,
  sectorCount: number,
) {
  const {sites, links} = input.reduce(
    (
      result: {
        sites: Array<AnpSiteUploadKmlType>,
        links: Array<AnpLinkUploadKmlType>,
      },
      asset,
    ) => {
      if (asset.geometry.type === kmlFeatureType.site) {
        result.sites.push(convertType<AnpSiteUploadKmlType>(asset));
      } else if (asset.geometry.type === kmlFeatureType.link) {
        result.links.push(convertType<AnpLinkUploadKmlType>(asset));
      }
      return result;
    },
    {sites: [], links: []},
  );

  const uploadResults = {sites: [], links: [], nodes: []};

  sites.forEach(asset => {
    if (
      asset.properties.site_type !== kmlAnpStatus.DEMAND &&
      (!asset.properties.Status ||
        kmlAnpStatus[asset.properties.Status] === kmlAnpStatus.PROPOSED ||
        kmlAnpStatus[asset.properties.Status] === kmlAnpStatus.EXISTING)
    ) {
      uploadResults.sites.push({
        name: asset.properties.name,
        location: {
          latitude: asset.geometry.coordinates[1],
          longitude: asset.geometry.coordinates[0],
          altitude: asset.geometry.coordinates[2],
          accuracy: 1000,
        },
      });
      if (asset.properties['Site Type'] || asset.properties.site_type) {
        const siteType =
          asset.properties['Site Type'] ?? asset.properties.site_type;
        if (siteType === kmlSiteType.CN) {
          uploadResults.nodes.push({
            name: asset.properties.name + '_1',
            node_type: ANP_NODE_TYPE.CN,
            is_primary: true,
            pop_node: false,
            site_name: asset.properties.name,
          });
        } else if (siteType === kmlSiteType.DN) {
          for (let i = 1; i <= sectorCount; i++) {
            uploadResults.nodes.push({
              name: asset.properties.name + '_' + i,
              node_type: ANP_NODE_TYPE.DN,
              is_primary: i === 1,
              pop_node: false,
              site_name: asset.properties.name,
            });
          }
        } else if (siteType === kmlSiteType.POP) {
          for (let i = 1; i <= sectorCount; i++) {
            uploadResults.nodes.push({
              name: asset.properties.name + '_' + i,
              node_type: ANP_NODE_TYPE.DN,
              is_primary: i === 1,
              pop_node: true,
              site_name: asset.properties.name,
            });
          }
        }
      }
    }
  });

  links.forEach(asset => {
    const siteNames = asset.properties.name.split('-');
    if (
      siteNames.length === 2 &&
      (!asset.properties.styleURL ||
        asset.properties.styleURL.includes(kmlAnpStatus.EXISTING) ||
        asset.properties.styleURL.includes(kmlAnpStatus.PROPOSED))
    ) {
      const siteTypes = getSiteTypes({siteNames, sites});
      if (!siteTypes[0] || !siteTypes[1]) {
        return;
      }

      const sectorA =
        siteTypes[0] === kmlSiteType.CN
          ? SECTOR_DEFAULT
          : calculateSector({
              coordinates: asset.geometry.coordinates,
              sectorCount,
            });
      const sectorB =
        siteTypes[1] === kmlSiteType.CN
          ? SECTOR_DEFAULT
          : calculateSector({
              coordinates: asset.geometry.coordinates.reverse(),
              sectorCount,
            });

      const a_node_name = siteNames[0] + '_' + sectorA;
      const z_node_name = siteNames[1] + '_' + sectorB;

      uploadResults.links.push({
        name: `link-${a_node_name}-${z_node_name}`,
        a_node_name,
        z_node_name,
        link_type: 1,
      });
    }
  });

  return uploadResults;
}

function calculateSector({
  coordinates,
  sectorCount,
}: {
  coordinates: Array<Array<number>>,
  sectorCount: number,
}) {
  //In the KML files provided there are sites and links but no nodes.
  //This code calculates the angle bearing from one site to the other.
  //With the number of sectors declared, we can assign which node/radio
  //the link should be created between.

  const lat1 = coordinates[0][1];
  const lng1 = coordinates[0][0];
  const lat2 = coordinates[1][1];
  const lng2 = coordinates[1][0];
  const dLon = lng2 - lng1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  return Math.ceil(brng / (360 / sectorCount));
}

function getSiteTypes({
  siteNames,
  sites,
}: {
  siteNames: Array<string>,
  sites: Array<AnpSiteUploadKmlType>,
}) {
  return siteNames.map(siteName => {
    const currentSite = sites.find(site => site.properties.name === siteName);
    return (
      currentSite?.properties['Site Type'] ?? currentSite?.properties.site_type
    );
  });
}