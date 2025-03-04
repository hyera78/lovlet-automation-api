describe('API testing age and zodiac', () => {
  let testCases;

  before(() => {
    cy.fixture('ageAndzodiac.json').then((data) => {
      testCases = data;
    });
  });

  it('Send use valid dob', () => {
    const { dob } = testCases.case_1.data;
    cy.ageAndzodiac({ dob }).then((response) => {
      expect(response.body).to.have.property('error').to.be.false;
      expect(response.body).to.have.property('status').to.equal(1);
      expect(response.body).to.have.property('code').to.equal(200);

      const { data } = response.body;
      expect(data).to.have.property('zodiac_id').to.be.a('string');
      expect(data).to.have.property('zodiac').to.be.a('string');
      expect(data).to.have.property('age').to.be.a('number');

      expect(response.body)
        .to.have.property('message')
        .to.equal('Success get age and zodiac');
    });
  });

  it('Send use empty dob', () => {
    const { dob } = testCases.case_2.data;
    cy.ageAndzodiac({ dob }).then((response) => {
      expect(response.body)
        .to.have.property('name')
        .to.equal('BadRequestError');
      expect(response.body).to.have.property('code').to.equal(400);
      expect(response.body).to.have.property('status').to.equal(0);
      expect(response.body).to.have.property('data');
      expect(response.body)
        .to.have.property('message')
        .to.equal('DOB format not valid');
      expect(response.body).to.have.property('error').to.be.true;
    });
  });
  it('Send use not valid dob', () => {
    const { dob } = testCases.case_3.data;
    cy.ageAndzodiac({ dob }).then((response) => {
      expect(response.body)
        .to.have.property('name')
        .to.equal('BadRequestError');
      expect(response.body).to.have.property('code').to.equal(400);
      expect(response.body).to.have.property('status').to.equal(0);
      expect(response.body).to.have.property('data');
      expect(response.body)
        .to.have.property('message')
        .to.equal('DOB format not valid');
      expect(response.body).to.have.property('error').to.be.true;
    });
  });
});
