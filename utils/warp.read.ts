import { isAddress } from "viem";
import { relayRegistryContract } from "@/config/warp.config";
import { responseOutput } from "@/utils/responseOutput";

type FunctionName = "verified" | "claimable";

export const warpRead = async (
  address: `0x${string}`,
  functionName: FunctionName
) => {
  if (!address)
    return responseOutput({
      status: 400,
      message: "No address provided",
    });

  if (!isAddress(address))
    return responseOutput({
      status: 400,
      message: "Invalid address provided",
    });

  try {
    const { result } = await relayRegistryContract.viewState({
      function: functionName,
      address,
    });

    // Construct the response
    const returnedData = (result as string[]).map((data) => {
      return {
        fingerprint: data,
        status: functionName,
        active: true,
        class: "",
      };
    });

    const count = Object.keys(result as object).length;
    const message =
      count === 0
        ? `No ${functionName} relays found`
        : `Success. All ${functionName} relays fetched.`;

    return responseOutput({
      data: {
        count,
        relays: returnedData,
      },
      message,
      status: 200,
    });
  } catch (error) {
    return responseOutput({
      data: error,
      status: 500,
      message: "Error",
    });
  }
};
