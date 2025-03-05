describe('Test API send OTP Recovery', () => {
  //case 1
  it('Hit API with valid input data', () => {
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
            ...testData, // Menggabungkan data lainnya
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

        cy.getDeleteAccountMessage().then((response) => {
          expect(response.body).to.have.property('status', 1);
          expect(response.body).to.have.property('error', false);
          expect(response.body).to.have.property('code', 200);
          expect(response.body).to.have.property(
            'message',
            'Success get list delete account message'
          );

          const { data } = response.body;
          expect(data).to.be.an('array').that.is.not.empty;

          data.forEach((item, index) => {
            expect(item).to.have.property('id').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('message').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('order').that.is.a('number');

            expect(item.order).to.equal(index);
          });

          const selectedIndex = 1;
          const selectedItem = data[selectedIndex];

          expect(selectedItem).to.have.property('id').that.is.a('string').and
            .not.empty;
          expect(selectedItem).to.have.property('message').that.is.a('string')
            .and.not.empty;

          cy.wrap(selectedItem.id).as('selectedId');
          cy.wrap(selectedItem.message).as('selectedMessage');
        });

        cy.get('@selectedId').then((id) => {
          cy.get('@selectedMessage').then((message) => {
            cy.log(`Selected ID: ${id}`);
            cy.log(`Selected Message: ${message}`);
            cy.deleteAccount({
              delete_account_message_id: id,
              message: message,
            }).then((response) => {
              console.log('Response Delete Account :', response.body);
              expect(response.body).to.have.property('status', 1);
              expect(response.body).to.have.property('error', false);
              expect(response.body).to.have.property('code', 200);
              expect(response.body).to.have.property(
                'message',
                'Success delete account'
              );

              const { data } = response.body;
              expect(data).to.have.property('deleted_at').that.is.a('string');
              expect(data).to.have.property('deleted_by').that.is.a('string');
            });
          });
        });

        cy.sendOTPRecovery({ email }).then((response) => {
          expect(response.body).to.have.property('error', false);
          expect(response.body).to.have.property('status', 1);
          expect(response.body).to.have.property('code', 200);
          expect(response.body).to.have.property(
            'message',
            'Success send otp recovery'
          );

          const { data } = response.body;
          expect(data).to.have.property('email', email).to.be.a('string');
          expect(data).to.have.property('otp').to.be.a('string');
          expect(data).to.have.property('expiry').to.be.a('string');

          cy.getLatestOTPFromYopmail(email.split('@')[0]);

          cy.get('@otpCode').then((otp) => {
            cy.log(`OTP recovery : ${otp}`);
            console.log('OTP recovery: ', otp);
          });
        });
      });
    });
  });

  //case 2
  it('Hit API with not valid format email', () => {
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
            ...testData, // Menggabungkan data lainnya
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

        cy.getDeleteAccountMessage().then((response) => {
          expect(response.body).to.have.property('status', 1);
          expect(response.body).to.have.property('error', false);
          expect(response.body).to.have.property('code', 200);
          expect(response.body).to.have.property(
            'message',
            'Success get list delete account message'
          );

          const { data } = response.body;
          expect(data).to.be.an('array').that.is.not.empty;

          data.forEach((item, index) => {
            expect(item).to.have.property('id').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('message').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('order').that.is.a('number');

            expect(item.order).to.equal(index);
          });

          const selectedIndex = 1;
          const selectedItem = data[selectedIndex];

          expect(selectedItem).to.have.property('id').that.is.a('string').and
            .not.empty;
          expect(selectedItem).to.have.property('message').that.is.a('string')
            .and.not.empty;

          cy.wrap(selectedItem.id).as('selectedId');
          cy.wrap(selectedItem.message).as('selectedMessage');
        });

        cy.get('@selectedId').then((id) => {
          cy.get('@selectedMessage').then((message) => {
            cy.log(`Selected ID: ${id}`);
            cy.log(`Selected Message: ${message}`);
            cy.deleteAccount({
              delete_account_message_id: id,
              message: message,
            }).then((response) => {
              console.log('Response Delete Account :', response.body);
              expect(response.body).to.have.property('status', 1);
              expect(response.body).to.have.property('error', false);
              expect(response.body).to.have.property('code', 200);
              expect(response.body).to.have.property(
                'message',
                'Success delete account'
              );

              const { data } = response.body;
              expect(data).to.have.property('deleted_at').that.is.a('string');
              expect(data).to.have.property('deleted_by').that.is.a('string');
            });
          });
        });

        cy.sendOTPRecovery({ email: 'abcd' }).then((response) => {
          expect(response.body).to.have.property('name', 'BadRequestError');
          expect(response.body).to.have.property('status', 0);
          expect(response.body).to.have.property('code', 400);
          expect(response.body).to.have.property('data');
          expect(response.body).to.have.property('message', 'Email not valid');
          expect(response.body).to.have.property('error', true);
        });
      });
    });
  });

  //case 3
  it('Hit API with empty email', () => {
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
            ...testData, // Menggabungkan data lainnya
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

        cy.getDeleteAccountMessage().then((response) => {
          expect(response.body).to.have.property('status', 1);
          expect(response.body).to.have.property('error', false);
          expect(response.body).to.have.property('code', 200);
          expect(response.body).to.have.property(
            'message',
            'Success get list delete account message'
          );

          const { data } = response.body;
          expect(data).to.be.an('array').that.is.not.empty;

          data.forEach((item, index) => {
            expect(item).to.have.property('id').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('message').that.is.a('string').and.not
              .empty;
            expect(item).to.have.property('order').that.is.a('number');

            expect(item.order).to.equal(index);
          });

          const selectedIndex = 1;
          const selectedItem = data[selectedIndex];

          expect(selectedItem).to.have.property('id').that.is.a('string').and
            .not.empty;
          expect(selectedItem).to.have.property('message').that.is.a('string')
            .and.not.empty;

          cy.wrap(selectedItem.id).as('selectedId');
          cy.wrap(selectedItem.message).as('selectedMessage');
        });

        cy.get('@selectedId').then((id) => {
          cy.get('@selectedMessage').then((message) => {
            cy.log(`Selected ID: ${id}`);
            cy.log(`Selected Message: ${message}`);
            cy.deleteAccount({
              delete_account_message_id: id,
              message: message,
            }).then((response) => {
              console.log('Response Delete Account :', response.body);
              expect(response.body).to.have.property('status', 1);
              expect(response.body).to.have.property('error', false);
              expect(response.body).to.have.property('code', 200);
              expect(response.body).to.have.property(
                'message',
                'Success delete account'
              );

              const { data } = response.body;
              expect(data).to.have.property('deleted_at').that.is.a('string');
              expect(data).to.have.property('deleted_by').that.is.a('string');
            });
          });
        });

        cy.sendOTPRecovery({ email: '' }).then((response) => {
          expect(response.body).to.have.property('name', 'BadRequestError');
          expect(response.body).to.have.property('status', 0);
          expect(response.body).to.have.property('code', 400);
          expect(response.body).to.have.property('data');
          expect(response.body).to.have.property('message', 'Email required');
          expect(response.body).to.have.property('error', true);
        });
      });
    });
  });
});
