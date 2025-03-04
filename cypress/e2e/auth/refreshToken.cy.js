describe('API refresh token', () => {
  let testCases;

  before(() => {
    cy.fixture('refreshToken.json').then((data) => {
      testCases = data;
    });
  });

  it('use valid refresh token dan valid device id', () => {
    const { device_id, platform, fcm_token } = testCases.case_1.data;
    const email = 'tester_lovlet@yopmail.com';

    cy.sendOTP({
      email,
      device_id: 'IOS',
      fcm_token: 'test',
      platform: 'ios',
    }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.wait(5000);

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
          //   expect(data)
          //     .to.have.property('active_fcm_token_count')
          //     .to.be.a('number');

          cy.wrap(data.refresh_token).as('refresh_token');
        }
      );
    });

    cy.get('@refresh_token').then((refresh_token) => {
      cy.refreshToken({ refresh_token, device_id, platform, fcm_token }).then(
        (response) => {
          cy.log('Full Response:', JSON.stringify(response, null, 2));
          console.log('Response:', response); // Jika ingin melihat di console browser

          expect(response.body).to.have.property('error').to.be.false;
          expect(response.body).to.have.property('status').to.equal(1);
          expect(response.body).to.have.property('code').to.equal(200);
          expect(response.body)
            .to.have.property('message')
            .to.equal('Success refresh token');

          const { data } = response.body;
          expect(data).to.have.property('access_token').to.be.a('string').and
            .not.empty;
          expect(data).to.have.property('refresh_token').to.be.a('string').and
            .not.empty;

          const { user_data } = data;
          expect(user_data).to.be.an('object');
          expect(user_data).to.have.property('is_premium').to.be.an('boolean');
          expect(user_data).to.have.property('id').to.be.a('string').and.not
            .empty;
          expect(user_data).to.have.property('username').to.be.an('string');

          expect(user_data.photo_profile).to.be.an('array');

          if (user_data.photo_profile.length > 0) {
            const photo = user_data.photo_profile[0];

            const expectedKeys = [
              'name',
              'url',
              'order',
              'mimetype',
              'size',
              'originalname',
            ];

            const currentKeys = Object.keys(photo);

            console.log('Expected Keys:', expectedKeys);
            console.log('Current Keys:', currentKeys);

            expectedKeys.forEach((key) => {
              expect(photo).to.have.property(key);
            });

            expect(photo.name).to.be.a('string');
            expect(photo.url).to.include('https://');
            expect(photo.order).to.be.a('number');
            expect(photo.mimetype).to.be.a('string');
            expect(photo.size).to.be.a('number');
            expect(photo.originalname).to.be.a('string');
          }

          // expect(user_data.photo_profile).to.be.an('array');
          // if (user_data.photo_profile.length > 0) {
          //   const photo = user_data.photo_profile[0];

          //   expect(photo).to.have.property('name').that.is.a('string');
          //   expect(photo).to.have.property('url').that.includes('https://');
          //   expect(photo).to.have.property('order').that.is.a('number');
          //   expect(photo).to.have.property('mimetype').that.is.a('string');
          //   expect(photo).to.have.property('size').that.is.a('number');
          //   expect(photo).to.have.property('originalname').that.is.a('string');
          //   expect(photo).to.have.property('similarity').that.is.a('number');
          //   expect(photo).to.have.property('verified').that.is.a('boolean');
          //   // expect(photo)
          //   //   .to.have.property('meta')
          //   //   .that.is.oneOf([null, Object(photo.meta)]);
          // }

          expect(user_data).to.have.property('is_verified').to.be.an('boolean');
          expect(user_data).to.have.property('email').to.be.an('string');
          expect(user_data)
            .to.have.property('dob')
            .to.match(/^\d{4}-\d{2}-\d{2}$/);
          expect(user_data).to.have.property('gender').to.be.an('number');
          expect(user_data)
            .to.have.property('timezone_preffered_abbrev')
            .to.be.a('string');
          expect(user_data)
            .to.have.property('timezone_preffered_region')
            .to.be.a('string');
        }
      );
    });
  });

  it('use not valid refresh token dan valid device id', () => {
    const { refresh_token, device_id, platform, fcm_token } =
      testCases.case_2.data;
    cy.refreshToken({ refresh_token, device_id, platform, fcm_token }).then(
      (response) => {
        expect(response.body)
          .to.have.property('name')
          .to.equal('RefreshTokenCredentialError');
        expect(response.body).to.have.property('code').to.equal(401);
        expect(response.body).to.have.property('status').to.equal(4014);
        expect(response.body).to.have.property('data');
        expect(response.body)
          .to.have.property('message')
          .to.equal('Refresh token invalid. Please verify your credentials.');
        expect(response.body).to.have.property('error').to.be.true;
      }
    );
  });

  it('use empty refresh token dan empty valid device id', () => {
    const { refresh_token, device_id, platform, fcm_token } =
      testCases.case_3.data;
    cy.refreshToken({ refresh_token, device_id, platform, fcm_token }).then(
      (response) => {
        expect(response.body)
          .to.have.property('name')
          .to.equal('BadRequestError');
        expect(response.body).to.have.property('code').to.equal(400);
        expect(response.body).to.have.property('status').to.equal(0);
        expect(response.body).to.have.property('data');
        expect(response.body)
          .to.have.property('message')
          .to.equal('Device ID and token required');
        expect(response.body).to.have.property('error').to.be.true;
      }
    );
  });
});
