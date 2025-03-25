describe('API Test Get Zodiac', () => {
  //case 1
  it('Get Zodiac', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomEmail().then((email) => {
      cy.log(`Generated Email: ${email}`);

      cy.generateRandomFCMToken().then((fcmToken) => {
        cy.log(`Generated FCM Token: ${fcmToken}`);

        cy.sendOTP({
          email,
          device_id: testData.device_id,
          fcm_token: fcmToken,
          platform,
        }).then((response) => {
          expect(response.status).to.eq(200);
        });

        cy.wait(5000);

        cy.getLatestOTPFromYopmail(email.split('@')[0]);

        cy.get('@otpCode').then((otp) => {
          cy.log(`OTP: ${otp}`);

          cy.verifyOTP({
            email,
            otp,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.body).to.have.property('code').to.equal(200);
          });

          const signupData = {
            email,
            fcm_token: fcmToken,
            ...testData,
          };

          cy.signUp(signupData).then((response) => {
            cy.log('Full Response:', response);
            console.log('Full Response:', response);

            expect(response.status).to.equal(200);
          });
        });

        cy.sendOTP({
          email,
          device_id: testData.device_id,
          fcm_token: fcmToken,
          platform,
        }).then((response) => {
          expect(response.status).to.eq(200);
        });

        cy.wait(5000);

        cy.getLatestOTPFromYopmail(email.split('@')[0]);

        cy.get('@otpCode').then((otp) => {
          cy.log(`OTP: ${otp}`);

          cy.verifyOTP({
            email,
            otp,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.body).to.have.property('code').to.equal(200);
            const { data } = response.body;
            expect(data).to.have.property('access_token').to.be.a('string').and
              .not.empty;
            Cypress.env('accessToken', data.access_token);
          });
        });

        cy.prefferedTimezone().then((response) => {
          expect(response.body).to.have.property('status', 1);
          expect(response.body).to.have.property('error', false);
          expect(response.body).to.have.property('code', 200);
          expect(response.body).to.have.property(
            'message',
            'Success get timezone user'
          );
          const { data } = response.body;
          expect(data)
            .to.have.property('timezone_preffered_abbrev')
            .to.be.a('string');
          expect(data)
            .to.have.property('timezone_preffered_region')
            .to.be.a('string');
        });
      });
    });
  });
});
