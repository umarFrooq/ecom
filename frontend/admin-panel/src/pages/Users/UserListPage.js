import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Table, Button, Spinner, Alert, Form, Pagination } from 'react-bootstrap';
// import { Link, useNavigate } from 'react-router-dom'; // For edit user page if created
import { getAdminUsers /*, updateAdminUser (for role/status update) */ } from '../../services/adminApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faToggleOn, faToggleOff, faUserPlus } from '@fortawesome/free-solid-svg-icons'; // faUserSlash for delete/deactivate

const UserListPage = () => {
  const { t } = useTranslation();
  // const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [totalUsers, setTotalUsers] = useState(0); // Backend doesn't send totalUsers yet for /auth/users
  const usersPerPage = 10;

  // TODO: Add filters for role, status, search by username/email

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Backend /auth/users needs to support pagination for this to work properly
      const params = {
          page: currentPage,
          limit: usersPerPage,
          sort: 'createdAt'
      };
      const response = await getAdminUsers(params);
      if (response.data && response.data.success) {
        setUsers(response.data.data);
        // Assuming backend sends total count for pagination if implemented
        // For now, if backend sends all users, calculate pagination based on that
        const totalFetchedUsers = response.data.count || response.data.data.length;
        // setTotalUsers(totalFetchedUsers);
        setTotalPages(Math.ceil(totalFetchedUsers / usersPerPage));
        if (totalFetchedUsers === 0) setTotalPages(0);


      } else {
        setError(response.data.message || t('admin.users.list.errorFetchDefault'));
      }
    } catch (err) {
      setError(err.message || err.error || t('admin.users.list.errorFetchNetwork'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t]); // Add other filter states here if they are dependencies

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUserStatus = async (userId, newStatus) => {
    // TODO: Implement backend and service call for this
    alert(`Mock: Update user ${userId} status to ${newStatus}`);
    // Example: await updateAdminUser(userId, { isActive: newStatus }); fetchUsers();
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    // TODO: Implement backend and service call for this
    alert(`Mock: Update user ${userId} role to ${newRole}`);
    // Example: await updateAdminUser(userId, { role: newRole }); fetchUsers();
  };


  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-3"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.users.list.pageTitle')} | {t('adminPanel.title')}</title>
      </Helmet>
      <Container fluid className="p-4">
        <Row className="align-items-center mb-3">
          <Col md={6}>
            <h2 className="admin-page-title">{t('admin.users.list.title')}</h2>
          </Col>
          <Col md={6} className="text-md-end">
            <Button variant="primary" onClick={() => alert('TODO: Navigate to create admin/editor user form')}>
              <FontAwesomeIcon icon={faUserPlus} className="me-2" />
              {t('admin.users.list.addNewAdminButton')}
            </Button>
          </Col>
        </Row>

        {/* TODO: Add Filter UI here */}

        <Table responsive hover className="admin-table shadow-sm bg-white">
          <thead>
            <tr>
              <th>{t('admin.users.list.headerUsername')}</th>
              <th>{t('admin.users.list.headerEmail')}</th>
              <th>{t('admin.users.list.headerName')}</th>
              <th>{t('admin.users.list.headerRole')}</th>
              <th>{t('admin.users.list.headerStatus')}</th>
              <th>{t('admin.users.list.headerJoined')}</th>
              <th>{t('admin.users.list.headerActions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</td>
                <td>
                  <Form.Select
                    size="sm"
                    value={user.role}
                    onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                    disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1} // Prevent locking out last admin
                  >
                    <option value="customer">{t('userRoles.customer')}</option>
                    <option value="editor">{t('userRoles.editor')}</option>
                    <option value="admin">{t('userRoles.admin')}</option>
                  </Form.Select>
                </td>
                <td>
                  <Button
                    variant={user.isActive ? "outline-success" : "outline-danger"}
                    size="sm"
                    onClick={() => handleUpdateUserStatus(user._id, !user.isActive)}
                    title={user.isActive ? t('admin.users.list.deactivateTooltip') : t('admin.users.list.activateTooltip')}
                  >
                    <FontAwesomeIcon icon={user.isActive ? faToggleOn : faToggleOff} />
                    <span className="ms-1">{user.isActive ? t('admin.users.list.statusActive') : t('admin.users.list.statusInactive')}</span>
                  </Button>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => alert(`TODO: Edit user ${user._id}`)}
                    title={t('admin.users.list.editAction')}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  {/* Optional: Delete user button - use with caution */}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="text-center p-4">{t('admin.users.list.noUsersFound')}</td>
              </tr>
            )}
          </tbody>
        </Table>
        {totalPages > 1 && users.length > 0 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                {[...Array(totalPages).keys()].map(num => (
                  <Pagination.Item
                    key={num + 1}
                    active={num + 1 === currentPage}
                    onClick={() => setCurrentPage(num + 1)}
                  >
                    {num + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            </div>
          )}
      </Container>
    </>
  );
};

export default UserListPage;
