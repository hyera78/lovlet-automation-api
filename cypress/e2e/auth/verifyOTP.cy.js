describe('API testing verify OTP', () => {
  let testCases;

  before(() => {
    cy.fixture('verifyOTP.json').then((data) => {
      testCases = data;
    });
  });

  // case 1
  it('Verify OTP with all valid inputs and status account is unregistered', () => {
    const { email, device_id, fcm_token, platform } = testCases.case_1.data;

    cy.sendOTP({ email }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.getLatestOTPFromYopmail(email.split('@')[0]);

    cy.get('@otpCode').then((otp) => {
      cy.log(`OTP: ${otp}`);
      cy.verifyOTP({ email, otp, device_id, fcm_token, platform }).then(
        (response) => {
          expect(response.body).to.have.property('error').to.be.false;
          expect(response.body).to.have.property('status').to.equal(1);
          expect(response.body).to.have.property('code').to.equal(200);

          const { data } = response.body;
          expect(data).to.have.property('is_otp_valid').to.be.true;
          expect(data).to.have.property('is_account_available').to.be.false;
          expect(data).to.have.property('is_properties_set').to.be.false;

          expect(response.body)
            .to.have.property('message')
            .to.equal('Success verify otp');
        }
      );
    });
  });

  // case 2
  it('Verify OTP for registered account', () => {
    const { email, device_id, fcm_token, platform } = testCases.case_2.data;
    cy.sendOTP({ email }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.getLatestOTPFromYopmail(email.split('@')[0]);

    cy.get('@otpCode').then((otp) => {
      cy.log(`OTP: ${otp}`);
      cy.verifyOTP({ email, otp, device_id, fcm_token, platform }).then(
        (response) => {
          expect(response.body).to.have.property('error').to.be.false;
          expect(response.body).to.have.property('status').to.equal(1);
          expect(response.body).to.have.property('code').to.equal(200);
          expect(response.body)
            .to.have.property('message')
            .to.equal('Success verify otp');

          const { data } = response.body;
          expect(data).to.have.property('is_otp_valid').to.be.true;
          expect(data).to.have.property('is_account_available').to.be.true;
          expect(data).to.have.property('is_properties_set').to.be.false;
          expect(data).to.have.property('access_token').to.be.a('string').and
            .not.empty;
          expect(data).to.have.property('refresh_token').to.be.a('string').and
            .not.empty;

          const { user_data } = data;
          expect(user_data).to.be.an('object');
          expect(user_data).to.have.property('id').to.be.a('string').and.not
            .empty;
          expect(user_data).to.have.property('username').to.be.a('string');
          expect(user_data).to.have.property('is_verified').to.be.a('boolean');
          expect(user_data).to.have.property('is_premium').to.be.a('boolean');
          expect(user_data)
            .to.have.property('dob')
            .to.match(/^\d{4}-\d{2}-\d{2}$/);
          expect(user_data).to.have.property('gender').to.be.a('number');
          expect(user_data).to.have.property('description');

          expect(user_data.photo_profile).to.be.an('array');
          if (user_data.photo_profile.length > 0) {
            const photo = user_data.photo_profile[0];
            expect(photo).to.have.all.keys([
              'name',
              'url',
              'order',
              'mimetype',
              'size',
              'originalname',
              // 'similarity',
              // 'verified',
              'meta',
            ]);
            expect(photo.name).to.be.a('string');
            expect(photo.url).to.include('https://');
            expect(photo.order).to.be.a('number');
            expect(photo.mimetype).to.be.a('string');
            expect(photo.size).to.be.a('number');
            expect(photo.originalname).to.be.a('string');
            // expect(photo.similarity).to.be.a('number');
            // expect(photo.verified).to.be.a('boolean');
          }

          expect(user_data).to.have.property('smoke');
          expect(user_data).to.have.property('drink');
          expect(user_data).to.have.property('exercise');
          expect(user_data).to.have.property('height');

          expect(user_data.profile_settings)
            .to.have.property('is_show_gender')
            .to.be.a('boolean');

          expect(user_data.photo_selfie).to.include.all.keys([
            'url',
            'name',
            'size',
          ]);
          expect(user_data.photo_selfie.url).to.include('https://');
          expect(user_data.photo_selfie.name).to.be.a('string');
          expect(user_data.photo_selfie.size).to.be.a('number');

          expect(user_data).to.have.property('latitude');
          expect(user_data).to.have.property('longitude');

          expect(user_data).to.have.property('zodiac');
          expect(user_data).to.have.property('edu_level');
          expect(user_data).to.have.property('industry');
          expect(user_data).to.have.property('interest');
          expect(user_data).to.have.property('love_language');
          expect(user_data).to.have.property('mbti');
          expect(user_data).to.have.property('pet');
          expect(user_data).to.have.property('religion');
          expect(user_data).to.have.property('sport');

          expect(user_data)
            .to.have.property('timezone_preffered_abbrev')
            .to.be.a('string');
          expect(user_data)
            .to.have.property('timezone_preffered_region')
            .to.be.a('string');
          expect(user_data)
            .to.have.property('created_at')
            .to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
        }
      );
    });
  });

  //case 3
  it('Verify OTP with empty OTP code', () => {
    const { email, device_id, otp, fcm_token, platform } =
      testCases.case_3.data;
    cy.verifyOTP({ email, device_id, otp, fcm_token, platform }).then(
      (response) => {
        expect(response.body)
          .to.have.property('name')
          .to.equal('BadRequestError');
        expect(response.body).to.have.property('code').to.equal(400);
        expect(response.body).to.have.property('status').to.equal(0);
        expect(response.body).to.have.property('data');
        expect(response.body)
          .to.have.property('message')
          .to.equal('Email and otp are required');
        expect(response.body).to.have.property('error').to.be.true;
      }
    );
  });

  // case 4
  it('Verify OTP with incorrect OTP code', () => {
    const { email, device_id, otp, fcm_token, platform } =
      testCases.case_4.data;

    cy.sendOTP({ email }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.verifyOTP({ email, device_id, otp, fcm_token, platform }).then(
      (response) => {
        expect(response.body)
          .to.have.property('name')
          .to.equal('BadRequestError');
        expect(response.body).to.have.property('code').to.equal(400);
        expect(response.body).to.have.property('status').to.equal(0);
        expect(response.body).to.have.property('data');
        expect(response.body)
          .to.have.property('message')
          .to.equal('Otp is not valid');
        expect(response.body).to.have.property('error').to.be.true;
      }
    );
  });

  // case 5
  it('Verify OTP with invalid email format', () => {
    const { email, device_id, otp, fcm_token, platform } =
      testCases.case_5.data;
    cy.verifyOTP({ email, device_id, otp, fcm_token, platform }).then(
      (response) => {
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
      }
    );
  });

  // case 6
  it('Verify otp with otp already verify', () => {
    const { email, device_id, fcm_token, platform } = testCases.case_6.data;
    cy.getLatestOTPFromYopmail(email.split('@')[0]);

    cy.get('@otpCode').then((otp) => {
      cy.log(`OTP: ${otp}`);
      cy.verifyOTP({ email, otp, device_id, fcm_token, platform }).then(
        (response) => {
          expect(response.body)
            .to.have.property('name')
            .to.equal('BadRequestError');
          expect(response.body).to.have.property('code').to.equal(400);
          expect(response.body).to.have.property('status').to.equal(0);
          expect(response.body).to.have.property('data');
          expect(response.body)
            .to.have.property('message')
            .to.equal('Otp already verified');
          expect(response.body).to.have.property('error').to.be.true;
        }
      );
    });
  });
});
