describe('API testing Add FCM token', () => {
  let testCases;

  before(() => {
    cy.fixture('addFCMToken.json').then((data) => {
      testCases = data;
    });
  });

  //case 1
  it('Hit API with valid data', () => {
    const { email, device_id, platform } = testCases.case_1.data;

    cy.sendOTP({ email }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.wait(5000); // Tunggu agar OTP masuk

    cy.getLatestOTPFromYopmail(email.split('@')[0]);

    cy.get('@otpCode').then((otp) => {
      cy.log(`OTP Retrieved: ${otp}`);

      cy.generateRandomFCMToken().as('fcmToken');

      cy.get('@fcmToken').then((fcm_token) => {
        cy.verifyOTP({ email, otp, device_id, fcm_token, platform }).then(
          (response) => {
            cy.log('Verify OTP Response:', response);
            console.log('Verify OTP Response:', response);

            expect(response.body).to.have.property('error', false);
            expect(response.body).to.have.property('status', 1);
            expect(response.body).to.have.property('code', 200);

            const { data } = response.body;
            expect(data).to.have.property('is_otp_valid', true);
            expect(data).to.have.property('is_account_available', true);
            expect(data).to.have.property('is_properties_set', false);
            expect(data).to.have.property('access_token').to.be.a('string').and
              .not.empty;

            Cypress.env('accessToken', data.access_token);

            expect(response.body).to.have.property(
              'message',
              'Success verify otp'
            );
          }
        );
      });
    });

    cy.get('@fcmToken').then((fcm_token) => {
      cy.addFCMToken({ device_id, fcm_token }).then((response) => {
        if (!response || !response.body) {
          throw new Error('Add FCM Token response is null or undefined');
        }

        cy.log('Add FCM Token Response:', response);
        console.log('Add FCM Token Response:', response);

        expect(response.body).to.have.property('error', false);
        expect(response.body).to.have.property('status', 1);
        expect(response.body).to.have.property('code', 201);
        expect(response.body).to.have.property('data');
        expect(response.body).to.have.property(
          'message',
          'Success add Fcm token'
        );
      });
    });
  });

  //case 2
  it('Hit API with not valid data', () => {
    const { email, device_id, platform } = testCases.case_2.data;

    cy.sendOTP({ email }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.wait(5000);

    cy.getLatestOTPFromYopmail(email.split('@')[0]);

    cy.get('@otpCode').then((otp) => {
      cy.log(`OTP Retrieved: ${otp}`);

      cy.generateRandomFCMToken().as('fcmToken');

      cy.get('@fcmToken').then((fcm_token) => {
        cy.verifyOTP({ email, otp, device_id, fcm_token, platform }).then(
          (response) => {
            cy.log('Verify OTP Response:', response);
            console.log('Verify OTP Response:', response);

            expect(response.body).to.have.property('error', false);
            expect(response.body).to.have.property('status', 1);
            expect(response.body).to.have.property('code', 200);

            const { data } = response.body;
            expect(data).to.have.property('is_otp_valid', true);
            expect(data).to.have.property('is_account_available', true);
            expect(data).to.have.property('is_properties_set', false);
            expect(data).to.have.property('access_token').to.be.a('string').and
              .not.empty;

            Cypress.env('accessToken', data.access_token);

            expect(response.body).to.have.property(
              'message',
              'Success verify otp'
            );
          }
        );
      });
    });

    cy.addFCMToken({ device_id: '', fcm_token: '' }).then((response) => {
      if (!response || !response.body) {
        throw new Error('Add FCM Token response is null or undefined');
      }

      cy.log('Add FCM Token Response:', response);
      console.log('Add FCM Token Response:', response);

      expect(response.body).to.have.property('name', 'BadRequestError');
      expect(response.body).to.have.property('error', true);
      expect(response.body).to.have.property('status', 0);
      expect(response.body).to.have.property('code', 400);
      expect(response.body).to.have.property('data');
      expect(response.body).to.have.property(
        'message',
        'UserID, DeviceID and FcmToken are required'
      );
    });
  });
});
