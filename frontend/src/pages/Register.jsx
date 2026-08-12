import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      if (data.data) {
        login(data.data);
      }
      navigate("/home");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-background px-4 py-8 font-body">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-3xl bg-surface rounded-3xl shadow-xl overflow-hidden flex"
      >
        {/* Left illustration panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-brand flex-col items-center justify-center p-10">
          <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center mb-5">
            <MessageCircle
              className="w-12 h-12 text-text-onBrand"
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
          <h2 className="text-3xl font-heading font-bold text-text-onBrand">
            Convo
          </h2>
          <p className="text-sm text-white/70 mt-1">Connect. Chat. Share.</p>
        </div>

        {/* Form panel */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10">
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center mb-3">
              <MessageCircle
                className="w-7 h-7 text-text-onBrand"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
            <h2 className="text-xl font-heading font-bold text-brand">Convo</h2>
          </div>

          <h1 className="text-xl font-heading font-bold text-text-primary">
            Create Account
          </h1>
          <p className="text-sm text-text-secondary mt-1 mb-7">
            Register to start chatting with friends
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

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

            {error && <p className="text-sm text-error text-center">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand text-text-onBrand font-heading font-semibold text-sm hover:bg-brand-dark transition-colors duration-200 mt-2 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Register"}
            </motion.button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand font-semibold hover:text-brand-dark"
            >
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
