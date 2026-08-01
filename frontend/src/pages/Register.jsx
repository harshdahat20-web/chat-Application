import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await registerUser(form.name, form.email, form.password);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      navigate("/home"); // apna actual home/dashboard route daal dena
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-10 font-body">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm bg-surface rounded-3xl shadow-xl shadow-brand-light p-8"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-brand p-2 rounded-xl">
              <MessageCircle
                className="w-5 h-5 text-text-onBrand"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
            <span className="text-2xl font-heading font-bold text-text-primary">
              Convo
            </span>
          </div>
          <p className="text-xs text-text-secondary">Connect. Chat. Conquer.</p>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-7"
        >
          <h1 className="text-xl font-heading font-semibold text-text-primary flex items-center justify-center gap-2">
            Create Account
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Join Convo and start chatting with your friends
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-error text-center">{error}</p>}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand text-text-onBrand font-heading font-semibold text-sm shadow-lg shadow-brand-light hover:bg-brand-dark transition-colors duration-200 mt-2 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </motion.button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand font-semibold hover:text-brand-dark"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
