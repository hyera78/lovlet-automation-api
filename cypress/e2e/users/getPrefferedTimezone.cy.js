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

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
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

            cy.wait(15000);

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

                      // Now proceed with login using the same email
                      cy.sendOTP({ email: userEmail }).then((response) => {
                        expect(response.status).to.eq(200);
                      });

                      cy.wait(15000);

                      cy.getLatestOTPFromMailGw(userEmail).then(() => {
                        cy.get('@otpCode').then((otp) => {
                          cy.log(`OTP Retrieved: ${otp}`);

                          cy.generateRandomFCMToken().as('fcmToken');

                          cy.get('@fcmToken').then((fcm_token) => {
                            cy.verifyOTP({
                              email: userEmail,
                              otp,
                              device_id: testData.device_id,
                              fcm_token,
                              platform,
                            }).then((response) => {
                              cy.log('Verify OTP Response:', response);
                              console.log('Verify OTP Response:', response);

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

                              const { data } = response.body;
                              expect(data).to.have.property(
                                'is_otp_valid',
                                true
                              );
                              expect(data).to.have.property(
                                'is_account_available',
                                true
                              );
                              expect(data).to.have.property(
                                'is_properties_set',
                                false
                              );
                              expect(data)
                                .to.have.property('access_token')
                                .to.be.a('string').and.not.empty;

                              Cypress.env('accessToken', data.access_token);

                              expect(response.body).to.have.property(
                                'message',
                                'Success verify otp'
                              );

                              cy.prefferedTimezone().then((response) => {
                                expect(response.body).to.have.property(
                                  'status',
                                  1
                                );
                                expect(response.body).to.have.property(
                                  'error',
                                  false
                                );
                                expect(response.body).to.have.property(
                                  'code',
                                  200
                                );
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
