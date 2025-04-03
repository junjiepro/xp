import { UserDevice } from "@/types/datas.types";
import { atom, useAtomValue, useSetAtom } from "jotai";

const devices = atom<UserDevice[]>([]);

export const useDevices = () => {
  return useAtomValue(devices);
};

export const useSetDevices = () => {
  return useSetAtom(devices);
};
