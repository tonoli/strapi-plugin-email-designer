/*
 *
 * HomePage
 *
 * Reference: https://strapi.io/documentation/developer-docs/latest/plugin-development/frontend-development.html#environment-setup
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
// import PropTypes from 'prop-types';
import { PopUpWarning, LoadingIndicator, ListButton, request, useGlobalContext } from 'strapi-helper-plugin';
import { Table, Button } from '@buffetjs/core';
import { Plus } from '@buffetjs/icons';
import { Header } from '@buffetjs/custom';
import { Link, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faClipboard, faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { isEmpty, pick } from 'lodash';
import getTrad from '../../utils/getTrad';
import pluginId from '../../pluginId';

const getUrl = (to) => (to ? `/plugins/${pluginId}/${to}` : `/plugins/${pluginId}`);

const Wrapper = styled.div`
  margin-bottom: 30px;
`

const HomePage = () => {
  const { push } = useHistory();
  const { formatMessage, plugins } = useGlobalContext();
  const [templates, setTemplates] = useState([]);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [duplicateConfirmationModal, setDuplicateConfirmationModal] = useState(false);
  const [activeTab, setActiveTab] = useState('listEmailTemplates');

  useEffect(() => {
    (async () => {
      const templatesData = await request(`/${pluginId}/templates`, {
        method: 'GET',
      });
      setTemplates(templatesData.map((row) => pick(row, ['id', 'name', 'enabled', 'createdAt'])));
    })();
  }, []);

  const duplicateTemplateHandler = useCallback(async () => {
    try {
      const response = await request(`/${pluginId}/templates/duplicate/${duplicateConfirmationModal}`, {
        method: 'POST',
      });
      push(getUrl(`design/${response.id}`));
    } catch (error) {
      strapi.notification.toggle({
        type: 'warning',
        message: { id: getTrad('notification.impossibleToDuplicate') },
      });
    }
  }, [duplicateConfirmationModal, push]);

  const deleteTemplateHandler = useCallback(async () => {
    try {
      const { removed } = await request(`/${pluginId}/templates/${deleteConfirmationModal}`, {
        method: 'DELETE',
      });

      if (removed) {
        setTemplates((state) => state.filter((el) => el.id !== deleteConfirmationModal));
        setDeleteConfirmationModal(false);
        strapi.notification.toggle({
          type: 'success',
          message: { id: getTrad('notification.templateDeleted') },
        });
      }
    } catch (error) {
      console.log(error);
      strapi.notification.toggle({
        type: 'warning',
        message: { id: getTrad('notification.impossibileToDeleteTemplate') },
      });
    }
  }, [deleteConfirmationModal]);

  const headers = [
    { name: formatMessage({ id: getTrad('table.name') }), value: 'name' },
    { name: 'ID', value: 'id' },
  ];

  return (
    <div className="container-fluid" style={{ padding: '18px 30px 66px 30px' }}>
      <PopUpWarning
        isOpen={!isEmpty(duplicateConfirmationModal)}
        content={{
          title: getTrad('pleaseConfirm'),
          message: getTrad('questions.sureToDuplicate'),
        }}
        popUpWarningType="danger"
        toggleModal={() => setDuplicateConfirmationModal(false)}
        onConfirm={async () => {
          duplicateTemplateHandler();
        }}
      />
      <PopUpWarning
        isOpen={!isEmpty(deleteConfirmationModal)}
        content={{
          title: getTrad('pleaseConfirm'),
          message: getTrad('questions.sureToDelete'),
        }}
        popUpWarningType="danger"
        toggleModal={() => setDeleteConfirmationModal(false)}
        onConfirm={async () => {
          deleteTemplateHandler();
        }}
      />
      <Header
        actions={[
          {
            label: formatMessage({ id: getTrad('newTemplate') }),
            onClick: () => push(getUrl(`design/new`)),
            color: 'primary',
            type: 'button',
            icon: true,
          },
        ]}
        title={{
          label: 'Email Designer',
        }}
        content="Design your own templates"
      />

      {!plugins[pluginId].isReady && <LoadingIndicator />}

      <Wrapper>
        <Table
          headers={headers}
          rows={templates}
          // customRow={this.CustomRow}
          onClickRow={(e, data) => {
            push(getUrl(`design/${data.id}`));
          }}
          rowLinks={[
            // @todo would be great to add popper for each action
            {
              icon: <FontAwesomeIcon icon={faPencilAlt} />,
              onClick: (data) => {
                push(getUrl(`design/${data.id}`));
              },
            },
            {
              icon: <FontAwesomeIcon icon={faClipboard} />,
              onClick: (data) => {
                navigator.clipboard.writeText(`${data.id}`).then(
                  function () {
                    strapi.notification.toggle({
                      type: 'success',
                      message: {
                        id: getTrad('notification.templateIdCopied'),
                      },
                    });
                    console.log('Template ID copied to clipboard successfully!');
                  },
                  function (err) {
                    console.error('Could not copy text: ', err);
                  }
                );
              },
            },
            {
              icon: <FontAwesomeIcon icon={faCopy} />,
              onClick: (data) => setDuplicateConfirmationModal(data.id),
            },
            {
              icon: <FontAwesomeIcon icon={faTrashAlt} />,
              onClick: (data) => setDeleteConfirmationModal(data.id),
            },
          ]}
        />
        <ListButton>
          <Button
            color="primary"
            type="button"
            onClick={() => push(getUrl(`design/new`))}
            icon={<Plus fill="#007eff" width="11px" height="11px" />}
          >
            {formatMessage({ id: getTrad('addNewTemplate') })}
          </Button>
        </ListButton>
      </Wrapper>
      <Link to={`/plugins/${pluginId}/how-to`}>{formatMessage({ id: getTrad('howToUse.link') })}</Link>
    </div>
  );
};

export default memo(HomePage);
