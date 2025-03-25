describe('API refresh token', () => {
  let testCases;

  before(() => {
    cy.fixture('refreshToken.json').then((data) => {
      testCases = data;
    });
  });

  it('use valid refresh token dan valid device id', () => {
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
                              expect(data)
                                .to.have.property('refresh_token')
                                .to.be.a('string').and.not.empty;

                              cy.wrap(data.refresh_token).as('refresh_token');
                              expect(response.body).to.have.property(
                                'message',
                                'Success verify otp'
                              );

                              cy.generateRandomFCMToken().then((fcm_token) => {
                                cy.get('@refresh_token').then(
                                  (refresh_token) => {
                                    cy.refreshToken({
                                      refresh_token,
                                      device_id: 'postman_localhost',
                                      platform,
                                      fcm_token,
                                    }).then((response) => {
                                      cy.log(
                                        'Full Response:',
                                        JSON.stringify(response, null, 2)
                                      );
                                      console.log(
                                        'Response body:',
                                        response.body
                                      );

                                      expect(response.body).to.have.property(
                                        'error'
                                      ).to.be.false;
                                      expect(response.body)
                                        .to.have.property('status')
                                        .to.equal(1);
                                      expect(response.body)
                                        .to.have.property('code')
                                        .to.equal(200);
                                      expect(response.body)
                                        .to.have.property('message')
                                        .to.equal('Success refresh token');

                                      const { data } = response.body;
                                      expect(data)
                                        .to.have.property('access_token')
                                        .to.be.a('string').and.not.empty;
                                      expect(data)
                                        .to.have.property('refresh_token')
                                        .to.be.a('string').and.not.empty;

                                      const { user_data } = data;
                                      expect(user_data).to.be.an('object');
                                      expect(user_data)
                                        .to.have.property('is_premium')
                                        .to.be.an('boolean');
                                      expect(user_data)
                                        .to.have.property('id')
                                        .to.be.a('string').and.not.empty;
                                      expect(user_data)
                                        .to.have.property('username')
                                        .to.be.an('string');

                                      expect(user_data.photo_profile).to.be.an(
                                        'array'
                                      );

                                      if (user_data.photo_profile.length > 0) {
                                        const photo =
                                          user_data.photo_profile[0];

                                        const expectedKeys = [
                                          'name',
                                          'url',
                                          'order',
                                          'mimetype',
                                          'size',
                                          'originalname',
                                        ];

                                        const currentKeys = Object.keys(photo);

                                        console.log(
                                          'Expected Keys:',
                                          expectedKeys
                                        );
                                        console.log(
                                          'Current Keys:',
                                          currentKeys
                                        );

                                        expectedKeys.forEach((key) => {
                                          expect(photo).to.have.property(key);
                                        });

                                        expect(photo.name).to.be.a('string');
                                        expect(photo.url).to.include(
                                          'https://'
                                        );
                                        expect(photo.order).to.be.a('number');
                                        expect(photo.mimetype).to.be.a(
                                          'string'
                                        );
                                        expect(photo.size).to.be.a('number');
                                        expect(photo.originalname).to.be.a(
                                          'string'
                                        );
                                      }

                                      expect(user_data)
                                        .to.have.property('is_verified')
                                        .to.be.an('boolean');
                                      expect(user_data)
                                        .to.have.property('email')
                                        .to.be.an('string');
                                      expect(user_data)
                                        .to.have.property('dob')
                                        .to.match(/^\d{4}-\d{2}-\d{2}$/);
                                      expect(user_data)
                                        .to.have.property('gender')
                                        .to.be.an('number');
                                      expect(user_data)
                                        .to.have.property(
                                          'timezone_preffered_abbrev'
                                        )
                                        .to.be.a('string');
                                      expect(user_data)
                                        .to.have.property(
                                          'timezone_preffered_region'
                                        )
                                        .to.be.a('string');
                                    });
                                  }
                                );
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
