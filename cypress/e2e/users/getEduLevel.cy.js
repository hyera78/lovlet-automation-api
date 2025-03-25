describe('API Test Get Sport', () => {
  //case 1
  it('Get Sport', () => {
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

        cy.eduLevel().then((response) => {
          expect(response.body).to.have.property('status', 1);
          expect(response.body).to.have.property('error', false);
          expect(response.body).to.have.property('code', 200);
          expect(response.body).to.have.property(
            'message',
            'Success get education level'
          );
          const { data } = response.body;
          expect(data).to.be.an('array').that.is.not.empty;

          data.forEach((item) => {
            expect(item).to.have.property('id').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('name').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('created_at').that.is.a('string').and
              .not.empty;
          });

          const { meta } = response.body;
          expect(meta).to.be.an('object').that.is.not.empty;
          expect(meta).to.have.property('page').to.be.a('number');
          expect(meta).to.have.property('limit').to.be.a('number');
          expect(meta).to.have.property('total_page').to.be.a('number');
          expect(meta).to.have.property('total_data').to.be.a('number');
        });
      });
    });
  });
});
