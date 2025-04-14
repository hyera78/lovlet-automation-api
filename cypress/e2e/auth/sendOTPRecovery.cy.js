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
    let userEmail;

    cy.generateRandomMailGwEmail().then((email) => {
      userEmail = email;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  // Sign up first
                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 200);
                      expect(jsonResponse).to.have.property('status', 1);
                      expect(jsonResponse).to.have.property('error', false);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Success kby signup'
                      );

                      const { data } = jsonResponse.data;

                      expect(data)
                        .to.have.property('access_token')
                        .to.be.a('string').and.not.empty;

                      // Set the token and continue with the next request
                      Cypress.env('accessToken', data.access_token);

                      // Now use the token to get delete account message
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
                          expect(item)
                            .to.have.property('id')
                            .that.is.a('string').and.not.empty;
                          expect(item)
                            .to.have.property('message')
                            .that.is.a('string').and.not.empty;
                          expect(item)
                            .to.have.property('order')
                            .that.is.a('number');

                          expect(item.order).to.equal(index);
                        });

                        const selectedIndex = 1;
                        const selectedItem = data[selectedIndex];

                        expect(selectedItem)
                          .to.have.property('id')
                          .that.is.a('string').and.not.empty;
                        expect(selectedItem)
                          .to.have.property('message')
                          .that.is.a('string').and.not.empty;

                        // Delete account with the selected message
                        cy.deleteAccount({
                          delete_account_message_id: selectedItem.id,
                          message: selectedItem.message,
                        }).then((response) => {
                          console.log(
                            'Response Delete Account :',
                            response.body
                          );
                          expect(response.body).to.have.property('status', 1);
                          expect(response.body).to.have.property(
                            'error',
                            false
                          );
                          expect(response.body).to.have.property('code', 200);
                          expect(response.body).to.have.property(
                            'message',
                            'Success delete account'
                          );

                          const { data } = response.body;
                          expect(data)
                            .to.have.property('deleted_at')
                            .that.is.a('string');
                          expect(data)
                            .to.have.property('deleted_by')
                            .that.is.a('string');

                          // Now send OTP recovery
                          cy.sendOTPRecovery({ email: userEmail }).then(
                            (response) => {
                              expect(response.body).to.have.property(
                                'error',
                                false
                              );
                              expect(response.body).to.have.property(
                                'status',
                                1
                              );
                              expect(response.body).to.have.property(
                                'code',
                                200
                              );
                              expect(response.body).to.have.property(
                                'message',
                                'Success send otp recovery'
                              );

                              const { data } = response.body;
                              expect(data)
                                .to.have.property('email', userEmail)
                                .to.be.a('string');
                              expect(data)
                                .to.have.property('otp')
                                .to.be.a('string');
                              expect(data)
                                .to.have.property('expiry')
                                .to.be.a('string');

                              // Mengganti getLatestOTPFromYopmail dengan getLatestOTPFromMailGw
                              cy.getLatestOTPFromMailGw(userEmail).then(() => {
                                cy.get('@otpCode').then((otp) => {
                                  cy.log(`OTP recovery : ${otp}`);
                                  console.log('OTP recovery: ', otp);
                                });
                              });
                            }
                          );
                        });
                      });
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
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
    let userEmail;

    cy.generateRandomMailGwEmail().then((email) => {
      userEmail = email;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  // Sign up first
                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 200);
                      expect(jsonResponse).to.have.property('status', 1);
                      expect(jsonResponse).to.have.property('error', false);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Success kby signup'
                      );

                      const { data } = jsonResponse.data;

                      expect(data)
                        .to.have.property('access_token')
                        .to.be.a('string').and.not.empty;

                      // Set the token and continue with the next request
                      Cypress.env('accessToken', data.access_token);

                      // Now use the token to get delete account message
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
                          expect(item)
                            .to.have.property('id')
                            .that.is.a('string').and.not.empty;
                          expect(item)
                            .to.have.property('message')
                            .that.is.a('string').and.not.empty;
                          expect(item)
                            .to.have.property('order')
                            .that.is.a('number');

                          expect(item.order).to.equal(index);
                        });

                        const selectedIndex = 1;
                        const selectedItem = data[selectedIndex];

                        expect(selectedItem)
                          .to.have.property('id')
                          .that.is.a('string').and.not.empty;
                        expect(selectedItem)
                          .to.have.property('message')
                          .that.is.a('string').and.not.empty;

                        // Delete account with the selected message
                        cy.deleteAccount({
                          delete_account_message_id: selectedItem.id,
                          message: selectedItem.message,
                        }).then((response) => {
                          console.log(
                            'Response Delete Account :',
                            response.body
                          );
                          expect(response.body).to.have.property('status', 1);
                          expect(response.body).to.have.property(
                            'error',
                            false
                          );
                          expect(response.body).to.have.property('code', 200);
                          expect(response.body).to.have.property(
                            'message',
                            'Success delete account'
                          );

                          const { data } = response.body;
                          expect(data)
                            .to.have.property('deleted_at')
                            .that.is.a('string');
                          expect(data)
                            .to.have.property('deleted_by')
                            .that.is.a('string');

                          // Now send OTP recovery
                          cy.sendOTPRecovery({ email: 'abcd' }).then(
                            (response) => {
                              expect(response.body).to.have.property(
                                'name',
                                'BadRequestError'
                              );
                              expect(response.body).to.have.property(
                                'status',
                                0
                              );
                              expect(response.body).to.have.property(
                                'code',
                                400
                              );
                              expect(response.body).to.have.property('data');
                              expect(response.body).to.have.property(
                                'message',
                                'Email not valid'
                              );
                              expect(response.body).to.have.property(
                                'error',
                                true
                              );
                            }
                          );
                        });
                      });
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
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
    let userEmail;

    cy.generateRandomMailGwEmail().then((email) => {
      userEmail = email;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  // Sign up first
                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 200);
                      expect(jsonResponse).to.have.property('status', 1);
                      expect(jsonResponse).to.have.property('error', false);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Success kby signup'
                      );

                      const { data } = jsonResponse.data;

                      expect(data)
                        .to.have.property('access_token')
                        .to.be.a('string').and.not.empty;

                      // Set the token and continue with the next request
                      Cypress.env('accessToken', data.access_token);

                      // Now use the token to get delete account message
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
                          expect(item)
                            .to.have.property('id')
                            .that.is.a('string').and.not.empty;
                          expect(item)
                            .to.have.property('message')
                            .that.is.a('string').and.not.empty;
                          expect(item)
                            .to.have.property('order')
                            .that.is.a('number');

                          expect(item.order).to.equal(index);
                        });

                        const selectedIndex = 1;
                        const selectedItem = data[selectedIndex];

                        expect(selectedItem)
                          .to.have.property('id')
                          .that.is.a('string').and.not.empty;
                        expect(selectedItem)
                          .to.have.property('message')
                          .that.is.a('string').and.not.empty;

                        // Delete account with the selected message
                        cy.deleteAccount({
                          delete_account_message_id: selectedItem.id,
                          message: selectedItem.message,
                        }).then((response) => {
                          console.log(
                            'Response Delete Account :',
                            response.body
                          );
                          expect(response.body).to.have.property('status', 1);
                          expect(response.body).to.have.property(
                            'error',
                            false
                          );
                          expect(response.body).to.have.property('code', 200);
                          expect(response.body).to.have.property(
                            'message',
                            'Success delete account'
                          );

                          const { data } = response.body;
                          expect(data)
                            .to.have.property('deleted_at')
                            .that.is.a('string');
                          expect(data)
                            .to.have.property('deleted_by')
                            .that.is.a('string');

                          // Now send OTP recovery
                          cy.sendOTPRecovery({ email: '' }).then((response) => {
                            expect(response.body).to.have.property(
                              'name',
                              'BadRequestError'
                            );
                            expect(response.body).to.have.property('status', 0);
                            expect(response.body).to.have.property('code', 400);
                            expect(response.body).to.have.property('data');
                            expect(response.body).to.have.property(
                              'message',
                              'Email required'
                            );
                            expect(response.body).to.have.property(
                              'error',
                              true
                            );
                          });
                        });
                      });
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
