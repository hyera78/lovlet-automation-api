describe('API testing send otp', () => {
  let testCases;

  before(() => {
    cy.fixture('sendOTP.json').then((data) => {
      testCases = data;
    });
  });

  // case 1
  it('Send OTP use valid email', () => {
    const { email } = testCases.case_1.data;
    cy.sendOTP({ email }).then((response) => {
      expect(response.body).to.have.property('error').to.be.false;
      expect(response.body).to.have.property('status').to.equal(1);
      expect(response.body).to.have.property('code').to.equal(200);
      expect(response.body)
        .to.have.property('message')
        .to.equal('Success send otp');

      const { data } = response.body;
      expect(data).to.have.property('email').to.equal(email);
      expect(data).to.have.property('otp').to.be.a('string');
      expect(data).to.have.property('expiry').to.be.a('string');
    });
  });

  // case 2
  it('Send OTP use empty email', () => {
    const { email } = testCases.case_2.data;
    cy.sendOTP({ email }).then((response) => {
      expect(response.body)
        .to.have.property('name')
        .to.equal('BadRequestError');
      expect(response.body).to.have.property('code').to.equal(400);
      expect(response.body).to.have.property('status').to.equal(0);
      expect(response.body).to.have.property('data');
      expect(response.body)
        .to.have.property('message')
        .to.equal('Email is required');
      expect(response.body).to.have.property('error').to.be.true;
    });
  });

  // case 3
  it('Send OTP use invalid email random word', () => {
    const { email } = testCases.case_3.data;
    cy.sendOTP({ email }).then((response) => {
      expect(response.body)
        .to.have.property('name')
        .to.equal('BadRequestError');
      expect(response.body).to.have.property('code').to.equal(400);
      expect(response.body).to.have.property('status').to.equal(0);
      expect(response.body).to.have.property('data');
      expect(response.body)
        .to.have.property('message')
        .to.equal('Email is not valid');
      expect(response.body).to.have.property('error').to.be.true;
    });
  });

  // case 4
  it('Send OTP use invalid email emote', () => {
    const { email } = testCases.case_4.data;
    cy.sendOTP({ email }).then((response) => {
      expect(response.body)
        .to.have.property('name')
        .to.equal('BadRequestError');
      expect(response.body).to.have.property('code').to.equal(400);
      expect(response.body).to.have.property('status').to.equal(0);
      expect(response.body).to.have.property('data');
      expect(response.body)
        .to.have.property('message')
        .to.equal('Email is not valid');
      expect(response.body).to.have.property('error').to.be.true;
    });
  });
});
