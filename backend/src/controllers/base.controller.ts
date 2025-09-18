import { Request, Response } from 'express';

export abstract class BaseController {
  protected sendSuccess(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
    res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  }

  protected sendError(res: Response, message: string, statusCode: number = 500, errors?: any) {
    const response: any = {
      status: 'error',
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    res.status(statusCode).json(response);
  }

  protected sendPaginatedResponse(res: Response, data: any, pagination: any, message: string = 'Success') {
    res.json({
      status: 'success',
      message,
      data,
      pagination,
    });
  }
}