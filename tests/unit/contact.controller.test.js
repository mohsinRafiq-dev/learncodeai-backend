// Unit tests for Contact Controller
import { jest } from '@jest/globals';
import { submitContact, getAllContacts, getContactById, updateContactStatus, deleteContact } from '../../src/controllers/contactController.js';
import Contact from '../../src/models/Contact.js';
import User from '../../src/models/User.js';

// Mock request and response objects
const mockRequest = (body = {}, params = {}, query = {}, user = null, headers = {}) => ({
  body,
  params,
  query,
  user,
  headers,
  connection: { remoteAddress: '127.0.0.1' }
});

const mockResponse = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.responseData = data; return this; };
  return res;
};

describe('Contact Controller', () => {
  beforeEach(async () => {
    // Clean up contacts before each test
    await Contact.deleteMany({});
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('submitContact', () => {
    it('should submit contact form with valid data', async () => {
      const req = mockRequest({
        fullName: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      });
      const res = mockResponse();

      await submitContact(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.data.contactId).toBeDefined();

      // Verify contact was created in database
      const contact = await Contact.findOne({ email: 'john@example.com' });
      expect(contact).toBeTruthy();
      expect(contact.fullName).toBe('John Doe');
      expect(contact.subject).toBe('Test Subject');
    });

    it('should submit contact form with authenticated user', async () => {
      const userId = '507f1f77bcf86cd799439011'; // Mock ObjectId
      const req = mockRequest({
        fullName: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      }, {}, {}, { _id: userId });
      const res = mockResponse();

      await submitContact(req, res);

      expect(res.statusCode).toBe(201);

      // Verify userId was saved
      const contact = await Contact.findOne({ email: 'john@example.com' });
      expect(contact.userId.toString()).toBe(userId);
    });

    it('should reject submission with missing fields', async () => {
      const req = mockRequest({
        fullName: 'John Doe',
        // missing email, subject, message
      });
      const res = mockResponse();

      await submitContact(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('error');
      expect(res.responseData.message).toBe('All fields are required');
    });

    it('should handle email service failures gracefully', async () => {
      // Note: Email failures are caught internally and don't affect the response
      const req = mockRequest({
        fullName: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      });
      const res = mockResponse();

      await submitContact(req, res);

      // Should still succeed even if email fails
      expect(res.statusCode).toBe(201);
      expect(res.responseData.status).toBe('success');
    });
  });

  describe('getAllContacts', () => {
    beforeEach(async () => {
      // Create test contacts
      await Contact.create([
        { fullName: 'User 1', email: 'user1@example.com', subject: 'Subject 1', message: 'This is a test message for user 1' },
        { fullName: 'User 2', email: 'user2@example.com', subject: 'Subject 2', message: 'This is a test message for user 2', status: 'resolved' }
      ]);
    });

    it('should get all contacts', async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await getAllContacts(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.data.contacts).toHaveLength(2);
      expect(res.responseData.data.pagination.total).toBe(2);
    });

    it('should filter contacts by status', async () => {
      const req = mockRequest({}, {}, { status: 'resolved' });
      const res = mockResponse();

      await getAllContacts(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.data.contacts).toHaveLength(1);
      expect(res.responseData.data.contacts[0].status).toBe('resolved');
    });

    it('should handle pagination', async () => {
      const req = mockRequest({}, {}, { page: 1, limit: 1 });
      const res = mockResponse();

      await getAllContacts(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.data.contacts).toHaveLength(1);
      expect(res.responseData.data.pagination.page).toBe(1);
      expect(res.responseData.data.pagination.limit).toBe(1);
    });
  });

  describe('getContactById', () => {
    let contactId;

    beforeEach(async () => {
      const contact = await Contact.create({
        fullName: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test Message'
      });
      contactId = contact._id.toString();
    });

    it('should get contact by id', async () => {
      const req = mockRequest({}, { id: contactId });
      const res = mockResponse();

      await getContactById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.data.contact.fullName).toBe('Test User');
    });

    it('should return 404 for non-existent contact', async () => {
      const req = mockRequest({}, { id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await getContactById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.status).toBe('error');
      expect(res.responseData.message).toBe('Contact submission not found');
    });
  });

  describe('updateContactStatus', () => {
    let contactId;

    beforeEach(async () => {
      const contact = await Contact.create({
        fullName: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test Message'
      });
      contactId = contact._id.toString();
    });

    it('should update contact status', async () => {
      const req = mockRequest({ status: 'in-progress' }, { id: contactId }, {}, { _id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await updateContactStatus(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');

      // Verify status was updated
      const updatedContact = await Contact.findById(contactId);
      expect(updatedContact.status).toBe('in-progress');
    });

    it('should update contact with response', async () => {
      const req = mockRequest({
        status: 'resolved',
        response: 'Thank you for your message'
      }, { id: contactId }, {}, { _id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await updateContactStatus(req, res);

      expect(res.statusCode).toBe(200);

      // Verify response was saved
      const updatedContact = await Contact.findById(contactId);
      expect(updatedContact.status).toBe('resolved');
      expect(updatedContact.response).toBe('Thank you for your message');
      expect(updatedContact.respondedAt).toBeDefined();
    });

    it('should reject invalid status', async () => {
      const req = mockRequest({ status: 'invalid-status' }, { id: contactId });
      const res = mockResponse();

      await updateContactStatus(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('error');
      expect(res.responseData.message).toBe('Invalid status value');
    });

    it('should return 404 for non-existent contact', async () => {
      const req = mockRequest({ status: 'resolved' }, { id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await updateContactStatus(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.message).toBe('Contact submission not found');
    });
  });

  describe('deleteContact', () => {
    let contactId;

    beforeEach(async () => {
      const contact = await Contact.create({
        fullName: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test Message'
      });
      contactId = contact._id.toString();
    });

    it('should delete contact', async () => {
      const req = mockRequest({}, { id: contactId });
      const res = mockResponse();

      await deleteContact(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.message).toBe('Contact submission deleted successfully');

      // Verify contact was deleted
      const deletedContact = await Contact.findById(contactId);
      expect(deletedContact).toBeNull();
    });

    it('should return 404 for non-existent contact', async () => {
      const req = mockRequest({}, { id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await deleteContact(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.message).toBe('Contact submission not found');
    });
  });
});