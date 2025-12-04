import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import type { CASUserData, JWTPayload } from '../types/index.js';

export class AuthService {
  /**
   * Validate CAS ticket and extract user data using p3/serviceValidate
   * Returns user data with displayName, email, and classYear
   */
  async validateCASTicket(ticket: string): Promise<CASUserData | null> {
    const validateUrl = `${config.cas.baseUrl}/p3/serviceValidate`;
    const params = new URLSearchParams({
      service: config.cas.serviceUrl,
      ticket: ticket,
      format: 'json'
    });

    try {
      const response = await axios.get(`${validateUrl}?${params.toString()}`, {
        headers: { Accept: 'application/json' }
      });

      const data = response.data;

      if (!data?.serviceResponse) {
        console.error('Invalid CAS response structure');
        return null;
      }

      const serviceResponse = data.serviceResponse;

      if (serviceResponse.authenticationSuccess) {
        const userInfo = serviceResponse.authenticationSuccess;
        const attributes = userInfo.attributes || {};

        // Extract class year from grouperGroups
        let classYear: string | null = null;
        const grouperGroups = attributes.grouperGroups || [];
        const classYearGroup = grouperGroups.find((g: string) =>
          g.includes('PU:basis:classyear:')
        );
        if (classYearGroup) {
          classYear = classYearGroup.split(':')[3] || null;
        } else {
          classYear = 'Graduate';
        }

        return {
          netid: userInfo.user,
          displayName: attributes.displayname?.[0] || userInfo.user,
          email: attributes.mail?.[0] || null,
          classYear
        };
      }

      if (serviceResponse.authenticationFailure) {
        console.error('CAS authentication failure:', serviceResponse.authenticationFailure);
        return null;
      }

      console.error('Unexpected CAS response:', serviceResponse);
      return null;
    } catch (error) {
      console.error('CAS validation error:', error);
      return null;
    }
  }

  /**
   * Find or create user in database
   */
  async findOrCreateUser(userData: CASUserData) {
    let user = await prisma.user.findUnique({
      where: { username: userData.netid },
      include: { daily: true }
    });

    if (!user) {
      // Create new user with UserDaily record
      user = await prisma.user.create({
        data: {
          username: userData.netid,
          displayName: userData.displayName,
          email: userData.email,
          classYear: userData.classYear,
          daily: {
            create: {}
          }
        },
        include: { daily: true }
      });
    } else {
      // Update display name, email, class year if changed
      user = await prisma.user.update({
        where: { username: userData.netid },
        data: {
          displayName: userData.displayName,
          email: userData.email,
          classYear: userData.classYear
        },
        include: { daily: true }
      });
    }

    return user;
  }

  /**
   * Generate JWT token
   */
  generateToken(username: string, isAdmin: boolean): string {
    const payload: JWTPayload = { username, isAdmin };
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get CAS login URL
   */
  getLoginUrl(): string {
    return `${config.cas.baseUrl}/login?service=${encodeURIComponent(config.cas.serviceUrl)}`;
  }

  /**
   * Get CAS logout URL
   */
  getLogoutUrl(redirectUrl?: string): string {
    const logoutUrl = `${config.cas.baseUrl}/logout`;
    if (redirectUrl) {
      return `${logoutUrl}?service=${encodeURIComponent(redirectUrl)}`;
    }
    return logoutUrl;
  }
}
