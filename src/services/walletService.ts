import { httpClient } from './httpClient';

export type Wallet = {
  id: string;
  balance: number;
  passengerId: string;
};

export type WalletResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type ChargeWalletResponse = {
  isSuccess: boolean;
  message: string;
  iframeUrl?: string;
  result?: Wallet;
};

class WalletService {
  async getById(id: string): Promise<WalletResponse<Wallet>> {
    const { data } = await httpClient.get<WalletResponse<Wallet>>(`/Wallet/${id}`);
    return data;
  }

  async chargeWallet(amount: number, passengerId: string): Promise<ChargeWalletResponse> {
    const { data } = await httpClient.put<ChargeWalletResponse>(`/Wallet/${amount}/${passengerId}`);
    return data;
  }
}

export default new WalletService();

