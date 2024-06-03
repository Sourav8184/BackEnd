import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    // console.log("userId -> ", userId);
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generation the access token and referesh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { username, email, fullName, password } = req.body;
  /*
    if (fullName === "") {
      throw new ApiError(400, "FullName is Required:");
    }
    if (email === "") {
      throw new ApiError(400, "Email is Required:");
    }
    if (username === "") {
      throw new ApiError(400, "Username is Required:");
    }
    if (password === "") {
      throw new ApiError(400, "password is Required:");
    }
  */
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required! ");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "AvatarLocalPath File is required ");
  }

  // console.log("avaterLocalPath ", avatarLocalPath);
  // console.log("coverImageLocalPath ", coverImageLocalPath);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log("avater ", avatar);
  // console.log("coverImage ", coverImage);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is required ");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //  req.body -> data
  // username based or email based
  // one field is required username or email
  // find User
  // check password
  // generate access and referesh token
  // send cookies

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }

  //  if (!(username || email)) {
  //    throw new ApiError(400, "Username or Email is required");
  //  }

  const user = await User.findOne({ email });
  // const user = await User.findOne({ username });

  // const user = await User.findOne({
  //   $or: [{ username }, { password }],
  // });

  if (!user) {
    throw new ApiError(404, "User Not Found ");
  }

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  console.log("Access ->", accessToken);
  console.log("refresh ->", refreshToken);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const optionsForCookieNotChangeByFrontend = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, optionsForCookieNotChangeByFrontend)
    .cookie("refreshToken", refreshToken, optionsForCookieNotChangeByFrontend)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log("1");
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  console.log("2");
  const optionsForCookieNotChangeByFrontend = {
    httpOnly: true,
    secure: true,
  };
  console.log("3");
  return res
    .status(200)
    .clearCookie("accessToken", optionsForCookieNotChangeByFrontend)
    .clearCookie("refreshToken", optionsForCookieNotChangeByFrontend)
    .json(new ApiResponse(200, {}, "User Logout Successfully"));
});

export { registerUser, loginUser, logoutUser };
